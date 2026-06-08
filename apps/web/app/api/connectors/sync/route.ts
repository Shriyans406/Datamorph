import { NextRequest, NextResponse } from "next/server"
import { fetchGoogleSheetRows } from "@/services/connectors/google-sheets/google-sheets.service"
import { fetchAirtableRows } from "@/services/connectors/airtable/airtable.service"
import { fetchRestApiRows } from "@/services/connectors/api/rest-api.service"
import { inferSchema } from "@/services/datasets/schema/infer-schema"
import { generateStatistics } from "@/services/datasets/statistics/generate-statistics"
import { generateQualityReport } from "@/services/datasets/quality/quality-report"
import { generatePreview } from "@/services/datasets/preview/generate-preview"
import { generateDatasetProfile } from "@/services/datasets/profiling/generate-profile"
import {
    firestoreGetDocs,
    firestoreAddDoc,
    firestoreSetDoc,
    firestoreUpdateDoc,
    firestoreDeleteDoc,
} from "@/lib/firestore-server"

interface Connector {
    id: string;
    name: string;
    type: string;
    status: string;
    config: Record<string, unknown>;
    datasetId?: string;
    lastSyncAt?: string | null;
    syncInterval: string;
}

interface DatasetPayload {
    metadata: {
        name: string;
        rows: number;
        columns: number;
        uploadedAt: string;
        connectorId: string;
    };
    schema: unknown;
    statistics: unknown;
    quality: unknown;
    profile: unknown;
    preview: unknown;
    rows: unknown[];
}

async function getConnectors(): Promise<Connector[]> {
    return firestoreGetDocs("data_connectors") as Promise<Connector[]>
}

async function saveDatasetServer(dataset: DatasetPayload): Promise<string> {
    const id = await firestoreAddDoc("datasets", {
        metadata: dataset.metadata,
        schema: dataset.schema,
        statistics: dataset.statistics,
        quality: dataset.quality,
        profile: dataset.profile,
        preview: dataset.preview,
        createdAt: new Date().toISOString(),
    })
    // Save rows separately
    await firestoreAddDoc("dataset_rows", {
        datasetId: id,
        rows: dataset.rows.slice(0, 500),
    })
    return id
}

async function updateDatasetServer(id: string, dataset: DatasetPayload): Promise<void> {
    await firestoreSetDoc("datasets", id, {
        metadata: dataset.metadata,
        schema: dataset.schema,
        statistics: dataset.statistics,
        quality: dataset.quality,
        profile: dataset.profile,
        preview: dataset.preview,
        updatedAt: new Date().toISOString(),
    })
    // Update rows — find existing rows doc
    const rowsDocs = await firestoreGetDocs("dataset_rows")
    const existingRows = rowsDocs.find((d: Record<string, unknown>) => d.datasetId === id) as { id: string } | undefined
    if (existingRows?.id) {
        await firestoreUpdateDoc("dataset_rows", existingRows.id, {
            rows: dataset.rows.slice(0, 500),
        })
    } else {
        await firestoreAddDoc("dataset_rows", {
            datasetId: id,
            rows: dataset.rows.slice(0, 500),
        })
    }
}

async function updateConnectorServer(id: string, updates: Partial<Connector>): Promise<void> {
    await firestoreUpdateDoc("data_connectors", id, updates)
}

async function logSyncRunServer(log: Record<string, unknown>): Promise<void> {
    await firestoreAddDoc("connector_sync_logs", {
        ...log,
        syncTime: log.syncTime || Date.now(),
    })
}

// Log Archival Routine: Prune connector_sync_logs older than 7 days
async function pruneOldSyncLogs(): Promise<number> {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;
    
    try {
        const logs = await firestoreGetDocs("connector_sync_logs");
        let prunedCount = 0;
        
        for (const log of logs) {
            if (log.syncTime && log.syncTime < cutoffTime) {
                if (log.id) {
                    await firestoreDeleteDoc("connector_sync_logs", log.id);
                    prunedCount++;
                }
            }
        }
        
        return prunedCount;
    } catch (e) {
        console.error("Failed to prune old sync logs:", e);
        return 0;
    }
}

export async function POST(req: NextRequest) {
    try {
        const urlObj = new URL(req.url)
        const filterId = urlObj.searchParams.get("id")

        // Run archival routine asynchronously without blocking ingestion
        pruneOldSyncLogs().catch(console.error);

        // 1. Fetch connectors via REST (bypasses Firebase Client SDK emulator issue)
        const connectors = await getConnectors()

        const activeConnectors = connectors.filter(c => {
            if (filterId && c.id !== filterId) return false
            if (c.status === "paused") return false
            return true
        })

        const results: Record<string, unknown>[] = []

        for (const conn of activeConnectors) {
            let rows: Record<string, unknown>[] = []
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
                        connectorId: conn.id,
                    },
                    schema,
                    statistics,
                    quality,
                    preview,
                    profile,
                    rows,
                }

                let targetDatasetId = conn.datasetId

                // 4. Upsert dataset doc via REST
                if (targetDatasetId) {
                    await updateDatasetServer(targetDatasetId, datasetPayload)
                } else {
                    targetDatasetId = await saveDatasetServer(datasetPayload)
                }

                // 5. Update connector
                await updateConnectorServer(conn.id, {
                    datasetId: targetDatasetId,
                    lastSyncAt: new Date().toISOString(),
                    status: "active",
                })

                // 6. Log success
                await logSyncRunServer({
                    connectorId: conn.id,
                    connectorName: conn.name,
                    type: conn.type,
                    status: "success",
                    error: null,
                    syncTime: Date.now(),
                    recordsSynced: rows.length,
                })

                results.push({ id: conn.id, status: "success", count: rows.length })

            } catch (err) {
                console.error(`Connector sync failed for [${conn.id}]`, err)
                errorMsg = err instanceof Error ? err.message : "Failed data ingestion"

                await updateConnectorServer(conn.id, { status: "error" })
                await logSyncRunServer({
                    connectorId: conn.id,
                    connectorName: conn.name,
                    type: conn.type,
                    status: "failed",
                    error: errorMsg,
                    syncTime: Date.now(),
                    recordsSynced: 0,
                })

                results.push({ id: conn.id, status: "failed", error: errorMsg })
            }
        }

        return NextResponse.json({ success: true, processedCount: activeConnectors.length, results })
    } catch (e) {
        console.error("Scheduler handler crashed:", e)
        return NextResponse.json({ error: e instanceof Error ? e.message : "Scheduler handler crashed" }, { status: 500 })
    }
}
