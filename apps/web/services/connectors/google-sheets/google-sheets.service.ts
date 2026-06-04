import { ConnectorConfig } from "@/types/connectors.types"

export function getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id"
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/connectors/google/callback"
    const scope = encodeURIComponent("https://www.googleapis.com/auth/spreadsheets.readonly")

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
}

export async function exchangeCodeForTokens(code: string) {
    if (code === "mock-sandbox-code") {
        return {
            accessToken: "mock-access-token-" + Date.now(),
            refreshToken: "mock-refresh-token",
            expiry: Date.now() + 3600 * 1000
        }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId || "",
            client_secret: clientSecret || "",
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri || ""
        })
    })

    if (!response.ok) {
        throw new Error("Failed to exchange Google OAuth code: " + (await response.text()))
    }

    const data = await response.json()
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || "",
        expiry: Date.now() + (data.expires_in || 3600) * 1000
    }
}

export async function refreshAccessToken(refreshToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId || "",
            client_secret: clientSecret || "",
            refresh_token: refreshToken,
            grant_type: "refresh_token"
        })
    })

    if (!response.ok) {
        throw new Error("Failed to refresh Google token: " + (await response.text()))
    }

    const data = await response.json()
    return {
        accessToken: data.access_token,
        expiry: Date.now() + (data.expires_in || 3600) * 1000
    }
}

export async function fetchGoogleSheetRows(config: ConnectorConfig): Promise<Record<string, any>[]> {
    if (config.simulate) {
        // Return structured mock sheets data
        return [
            { "Employee ID": "EMP01", "Name": "Alice Vance", "Department": "Engineering", "Salary": 95000, "Performance": "Exceeds" },
            { "Employee ID": "EMP02", "Name": "Bob Miller", "Department": "Marketing", "Salary": 75000, "Performance": "Meets" },
            { "Employee ID": "EMP03", "Name": "Charlie Jenkins", "Department": "Finance", "Salary": 85000, "Performance": "Exceeds" },
            { "Employee ID": "EMP04", "Name": "Diana Ross", "Department": "Engineering", "Salary": 105000, "Performance": "Outstanding" }
        ]
    }

    let token = config.accessToken
    const expiry = config.expiry || 0

    if (Date.now() >= expiry && config.refreshToken) {
        const refreshed = await refreshAccessToken(config.refreshToken)
        token = refreshed.accessToken
        // Note: Caller is expected to persist updated token and config.expiry!
    }

    const sheetId = config.spreadsheetId
    const range = config.range || "Sheet1!A1:Z100"

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`, {
        headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
        throw new Error("Google Sheets fetch failed: " + (await response.text()))
    }

    const data = await response.json()
    const values: string[][] = data.values

    if (!values || values.length <= 1) {
        throw new Error("Target Sheet contains no rows of data")
    }

    const headers = values[0]
    return values.slice(1).map(row => {
        const item: Record<string, any> = {}
        headers.forEach((header, idx) => {
            item[header] = row[idx] !== undefined && row[idx] !== "" ? row[idx] : null
        })
        return item
    })
}
