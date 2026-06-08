"use client"

import { useState, useEffect } from "react"
import { Database, Plus, RefreshCw, Trash2, Link, CheckCircle2, Play, Layers, ShieldAlert, Loader2, ArrowRight } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, deleteDoc, doc, addDoc } from "firebase/firestore"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import NextLink from "next/link"

export default function ConnectorsTestPage() {
    const router = useRouter()
    const [connectors, setConnectors] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [datasets, setDatasets] = useState<any[]>([])
    const [isTriggeringCron, setIsTriggeringCron] = useState(false)
    const [syncingId, setSyncingId] = useState<string | null>(null)

    useEffect(() => {
        const unsubConn = onSnapshot(collection(db, "data_connectors"), snap => {
            setConnectors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        const unsubLogs = onSnapshot(collection(db, "connector_sync_logs"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setLogs(list.sort((a: any, b: any) => b.syncTime - a.syncTime))
        })
        const unsubData = onSnapshot(collection(db, "datasets"), snap => {
            setDatasets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return () => { unsubConn(); unsubLogs(); unsubData() }
    }, [])

    const handleCreateMockConnector = async (type: "google-sheets" | "airtable" | "api") => {
        try {
            toast.info(`Creating mock ${type} connector...`)
            const configPayload: any = { simulate: true }

            if (type === "google-sheets") {
                configPayload.spreadsheetId = "1mockSpreadsheetID"
                configPayload.range = "Sheet1!A1:E10"
                configPayload.accessToken = "mock-token"
            } else if (type === "airtable") {
                configPayload.baseId = "appMockBaseId"
                configPayload.tableIdOrName = "Mock Table"
                configPayload.personalAccessToken = "mock-airtable-pat"
            } else {
                configPayload.url = "https://mock-api.datamorph.io/metrics"
                configPayload.method = "GET"
                configPayload.jsonPath = "data"
            }

            await addDoc(collection(db, "data_connectors"), {
                userId: "test-user-admin",
                name: `Simulated ${type.replace("-", " ")} Source`,
                type,
                status: "active",
                lastSyncAt: null,
                syncInterval: "manual",
                createdAt: new Date().toISOString(),
                config: configPayload
            })
            toast.success("Mock connector created!")
        } catch {
            toast.error("Failed to create mock connector")
        }
    }

    const handleSync = async (id: string) => {
        setSyncingId(id)
        toast.info("Executing on-demand sync route...")
        try {
            const res = await fetch(`/api/connectors/${id}/sync`, { method: "POST" })
            const data = await res.json()
            if (data.success && data.results?.[0]?.status === "success") {
                toast.success(`Success! Synchronized ${data.results[0].count} rows.`)
            } else {
                toast.error("Sync run failed")
            }
        } catch {
            toast.error("Network sync trigger failed")
        } finally {
            setSyncingId(null)
        }
    }

    const handleTriggerSchedulerCron = async () => {
        setIsTriggeringCron(true)
        toast.info("Triggering scheduler cron API route...")
        try {
            const res = await fetch("/api/connectors/sync", { method: "POST" })
            const data = await res.json()
            if (data.success) {
                toast.success(`Cron executed! Synchronized ${data.processedCount} connectors.`)
            } else {
                toast.error("Scheduler run failed: " + data.error)
            }
        } catch {
            toast.error("Scheduler API trigger failed")
        } finally {
            setIsTriggeringCron(false)
        }
    }

    const handleClearAll = async () => {
        toast.info("Clearing simulated environments...")
        const p1 = connectors.map(c => deleteDoc(doc(db, "data_connectors", c.id)))
        const p2 = logs.map(l => deleteDoc(doc(db, "connector_sync_logs", l.id)))
        await Promise.all([...p1, ...p2])
        toast.success("Sandbox cleaned!")
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-6 font-sans">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <NextLink href="/" className="hover:text-indigo-400 transition-colors">Home</NextLink>
                <span>/</span>
                <span className="text-slate-300 font-medium">Data Connectors</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Database className="text-indigo-500 w-6 h-6" />
                        External Data Connectors Control
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Configure sandbox integrations, trigger automated scheduling cron runs, and monitor live dataset sync operations.
                    </p>
                </div>
            </div>

            {/* Test Action Toggles */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Sandbox Ingestion:</span>
                    <button
                        onClick={() => handleCreateMockConnector("google-sheets")}
                        className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer"
                    >
                        + Sheets Simulator
                    </button>
                    <button
                        onClick={() => handleCreateMockConnector("airtable")}
                        className="bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20 text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer"
                    >
                        + Airtable Simulator
                    </button>
                    <button
                        onClick={() => handleCreateMockConnector("api")}
                        className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer"
                    >
                        + REST API Simulator
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleTriggerSchedulerCron}
                        disabled={isTriggeringCron}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                    >
                        {isTriggeringCron ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        Trigger Sync Scheduler
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                        Reset Sandbox
                    </button>
                </div>
            </div>

            {/* Test Workstation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Simulated Connectors */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white">1. Simulated Data Connectors ({connectors.length})</h3>
                    {connectors.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-16 border border-dashed border-slate-800 rounded-xl">
                            No sandboxed connectors yet. Click a quick connector creator above.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {connectors.map(c => (
                                <div key={c.id} className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-800 text-[9px] font-bold border border-slate-700 px-1.5 py-0.5 rounded text-indigo-400 uppercase">
                                                {c.type}
                                            </span>
                                            <span className="font-semibold text-slate-200">{c.name}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Dataset ID: {c.datasetId || "No Sync Ingested"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSync(c.id)}
                                            disabled={syncingId === c.id}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                                        >
                                            {syncingId === c.id ? "Syncing..." : "Run Sync"}
                                        </button>
                                        {c.datasetId && (
                                            <button
                                                onClick={() => router.push(`/datasets/${c.datasetId}`)}
                                                className="text-indigo-400 hover:text-indigo-300 border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg p-1"
                                                title="View Dataset Profile"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Audit Trail & Profile Ingestion Verification */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white">2. Sync Log Records & Datasets</h3>
                    <div className="space-y-4">
                        <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync Log History ({logs.length})</h4>
                            {logs.length === 0 ? (
                                <p className="text-[11px] text-slate-500 py-2">No run logs recorded yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {logs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between text-[11px] border-b border-slate-900 pb-1.5 last:border-0">
                                            <span className="font-semibold text-slate-300 truncate max-w-[120px]">{log.connectorName}</span>
                                            <span className="text-slate-500">{log.recordsSynced} rows</span>
                                            {log.status === "success" ? (
                                                <span className="text-emerald-400 font-medium">success</span>
                                            ) : (
                                                <span className="text-red-400 font-medium" title={log.error || ""}>failed</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Ingested Datasets in Firestore ({datasets.length})</h4>
                            {datasets.filter(d => d.metadata?.isConnector || d.metadata?.connectorId).length === 0 ? (
                                <p className="text-[11px] text-slate-500 py-2">No datasets synced from external connectors yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {datasets.filter(d => d.metadata?.isConnector || d.metadata?.connectorId).map(d => (
                                        <div key={d.id} className="flex items-center justify-between text-[11px] bg-slate-900 border border-slate-800 p-2 rounded-lg">
                                            <div>
                                                <span className="font-semibold text-slate-200">{d.metadata?.name || d.id}</span>
                                                <span className="text-[9px] text-slate-500 block">Rows: {d.metadata?.rows} • Cols: {d.metadata?.columns}</span>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/datasets/${d.id}`)}
                                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                                            >
                                                Explore <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
