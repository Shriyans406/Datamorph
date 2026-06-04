import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, context: any) {
    try {
        const params = await context.params
        const { id } = params

        // Delegate to primary sync endpoint with parameter filter
        const triggerUrl = new URL(`/api/connectors/sync?id=${id}`, req.url)
        const response = await fetch(triggerUrl.toString(), { method: "POST" })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Manual sync crash" }, { status: 500 })
    }
}
