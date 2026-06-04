import { ConnectorConfig } from "@/types/connectors.types"

function resolveJsonPath(obj: any, path?: string): any {
    if (!path || path.trim() === "") return obj
    const parts = path.split(".")
    let current = obj
    for (const part of parts) {
        if (current === null || current === undefined) return []
        current = current[part]
    }
    return current
}

export async function fetchRestApiRows(config: ConnectorConfig): Promise<Record<string, any>[]> {
    if (config.simulate || !config.url) {
        // Return structured mock API records
        return [
            { "system_code": "NODE_01", "cpu_usage": 42.5, "memory_pct": 68.1, "network_in_mb": 1420, "healthy": true },
            { "system_code": "NODE_02", "cpu_usage": 88.2, "memory_pct": 92.4, "network_in_mb": 2840, "healthy": false },
            { "system_code": "NODE_03", "cpu_usage": 15.1, "memory_pct": 34.0, "network_in_mb": 512, "healthy": true }
        ]
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    }

    if (config.headers) {
        try {
            const parsedHeaders = JSON.parse(config.headers)
            Object.assign(headers, parsedHeaders)
        } catch (e) {
            console.warn("REST Connector headers failed parsing as JSON string", e)
        }
    }

    const options: RequestInit = {
        method: config.method || "GET",
        headers
    }

    if (config.method === "POST" && config.body) {
        options.body = config.body
    }

    const response = await fetch(config.url, options)

    if (!response.ok) {
        throw new Error(`REST API HTTP error ${response.status}: ` + (await response.text()))
    }

    const responseBody = await response.json()
    const targetData = resolveJsonPath(responseBody, config.jsonPath)

    if (!targetData) {
        throw new Error("Specified JSON path did not resolve to valid data in body")
    }

    return Array.isArray(targetData) ? targetData : [targetData]
}
