import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { fetchGoogleSheetRows } from "@/services/connectors/google-sheets/google-sheets.service"
import { fetchAirtableRows } from "@/services/connectors/airtable/airtable.service"
import { fetchRestApiRows } from "@/services/connectors/api/rest-api.service"
import { logSyncRun, updateConnector } from "@/repositories/connectors/connector.repository"
import { persistDataset, updateDataset } from "@/repositories/datasets/dataset.repository"
import { inferSchema } from "@/services/datasets/schema/infer-schema"
import { generateStatistics } from "@/services/datasets/statistics/generate-statistics"
import { generateQualityReport } from "@/services/datasets/quality/quality-report"
import { generatePreview } from "@/services/datasets/preview/generate-preview"
import { generateDatasetProfile } from "@/services/datasets/profiling/generate-profile"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
    try {
        const urlObj = new URL(req.url)
        const filterId = urlObj.searchParams.get("id")

        // 1. Fetch connectors
        const snap = await getDocs(collection(db, "data_connectors"))
        const connectors = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

        const activeConnectors = connectors.filter(c => {
            if (filterId && c.id !== filterId) return false
            if (c.status === "paused") return false
            return true
        })

        const results: any[] = []

        for (const conn of activeConnectors) {
            let rows: Record<string, any>[] = []
            let errorMsg: string | null = null

            try {
                // 2. Fetch external rows
                if (conn.type === "google-sheets") {
                    rows = await fetchGoogleSheetRows(conn.config)
                } else if (conn.type === "airtable") {
                    rows = await fetchAirtableRows(conn.config)
                } else if (conn.type === "api") {
                    rows = await fetchRestApiRows(conn.config)
                } else {
                    throw new Error("Unsupported connector type: " + conn.type)
                }

                // 3. Process into standard profile elements
                const schema = inferSchema(rows)
                const statistics = generateStatistics(rows)
                const quality = generateQualityReport(rows)
                const preview = generatePreview(rows)
                const profile = generateDatasetProfile(rows)

                const datasetPayload = {
                    metadata: {
                        name: conn.name + " (Synced)",
                        rows: rows.length,
                        columns: schema.columns.length,
                        uploadedAt: new Date().toISOString(),
                        connectorId: conn.id
                    },
                    schema,
                    statistics,
                    quality,
                    preview,
                    profile,
                    rows
                }

                let targetDatasetId = conn.datasetId

                // 4. Upsert dataset doc
                if (targetDatasetId) {
                    await updateDataset(targetDatasetId, datasetPayload)
                } else {
                    targetDatasetId = await persistDataset(datasetPayload)
                }

                // 5. Update connector
                await updateConnector(conn.id, {
                    datasetId: targetDatasetId,
                    lastSyncAt: new Date().toISOString(),
                    status: "active"
                })

                // 6. Log success
                await logSyncRun({
                    connectorId: conn.id,
                    connectorName: conn.name,
                    type: conn.type,
                    status: "success",
                    error: null,
                    syncTime: Date.now(),
                    recordsSynced: rows.length
                })

                results.push({ id: conn.id, status: "success", count: rows.length })

            } catch (err: any) {
                console.error(`Connector sync failed for [${conn.id}]`, err)
                errorMsg = err.message || "Failed data ingestion"

                await updateConnector(conn.id, { status: "error" })
                await logSyncRun({
                    connectorId: conn.id,
                    connectorName: conn.name,
                    type: conn.type,
                    status: "failed",
                    error: errorMsg,
                    syncTime: Date.now(),
                    recordsSynced: 0
                })

                results.push({ id: conn.id, status: "failed", error: errorMsg })
            }
        }

        return NextResponse.json({ success: true, processedCount: activeConnectors.length, results })
    } catch (e: any) {
        console.error("Scheduler handler crashed:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
