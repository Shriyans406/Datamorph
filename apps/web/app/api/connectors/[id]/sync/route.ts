import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Manual sync crash" }, { status: 500 })
    }
}
