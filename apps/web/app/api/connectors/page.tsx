"use client"

import { useState, useEffect } from "react"
import { Database, Plus, RefreshCw, Trash2, Calendar, Link, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { toast } from "sonner"
import { AddConnectorModal } from "@/components/connectors/add-connector-modal"

interface Connector {
    id: string;
    name: string;
    type: string;
    syncInterval: string;
    lastSyncAt?: string | null;
    status: string;
    config?: Record<string, unknown>;
    datasetId?: string;
}

interface SyncLog {
    id?: string;
    connectorName: string;
    syncTime: number;
    recordsSynced: number;
    status: string;
    error?: string | null;
}

export default function ConnectorsPage() {
    const [connectors, setConnectors] = useState<Connector[]>([])
    const [logs, setLogs] = useState<SyncLog[]>([])
    const [loading, setLoading] = useState(true)
    const [syncingId, setSyncingId] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)

    useEffect(() => {
        const unsubConn = onSnapshot(collection(db, "data_connectors"), snap => {
            setConnectors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Connector)))
            setLoading(false)
        }, () => setLoading(false))

        const unsubLogs = onSnapshot(collection(db, "connector_sync_logs"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SyncLog))
            list.sort((a, b) => b.syncTime - a.syncTime)
            setLogs(list)
        })

        return () => { unsubConn(); unsubLogs() }
    }, [])

    const handleSync = async (id: string) => {
        setSyncingId(id)
        toast.info("Triggering source synchronization...")
        try {
            const res = await fetch(`/api/connectors/${id}/sync`, { method: "POST" })
            const data = await res.json()
            if (data.success && data.results?.[0]?.status === "success") {
                toast.success(`Synchronized successfully! Ingested ${data.results[0].count} records.`)
            } else {
                toast.error("Sync failed: " + (data.results?.[0]?.error || data.error || "Unknown Error"))
            }
        } catch {
            toast.error("API call failed")
        } finally {
            setSyncingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        toast.info("Removing connector config...")
        try {
            await deleteDoc(doc(db, "data_connectors", id))
            toast.success("Connector removed.")
        } catch {
            toast.error("Failed to delete connector")
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Link className="w-6 h-6 text-indigo-400" />
                        External Data Connectors
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Connect Google Sheets, Airtable bases, or Custom APIs to keep your dashboards loaded automatically.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-md"
                >
                    <Plus className="w-4 h-4" /> Add Source Connector
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connectors List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Integrations</h3>

                    {loading ? (
                        <div className="flex justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                    ) : connectors.length === 0 ? (
                        <div className="border border-dashed border-slate-800 rounded-2xl p-20 text-center text-slate-500 bg-slate-900">
                            <Database className="w-8 h-8 mx-auto mb-3 opacity-40" />
                            <p className="text-xs font-semibold">No external data connectors configured</p>
                            <p className="text-[10px] mt-1 opacity-70">Link your Google Sheets or REST APIs to stream live data.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {connectors.map(c => (
                                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex items-center justify-between gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-slate-800 text-slate-300 font-bold border border-slate-700 px-2 py-0.5 rounded uppercase">
                                                {c.type === "google-sheets" ? "Google Sheets" : c.type === "airtable" ? "Airtable" : "REST API"}
                                            </span>
                                            <h4 className="font-semibold text-sm text-slate-200">{c.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> interval: {c.syncInterval}
                                            </span>
                                            {c.lastSyncAt && (
                                                <span>last sync: {new Date(c.lastSyncAt).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleSync(c.id)}
                                            disabled={syncingId === c.id}
                                            className="bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            {syncingId === c.id ? (
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            )}
                                            Sync Now
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="text-slate-500 hover:text-red-500 p-2 hover:bg-slate-950 rounded-xl transition-all cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Audit Logs Console */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Sync Audits & Run Logs
                    </h3>

                    {logs.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-10">No sync executions logged yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto divide-y divide-slate-800/50 pr-1">
                            {logs.map((log, idx) => (
                                <div key={log.id || idx} className="pt-3 first:pt-0 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">{log.connectorName}</span>
                                        <span className="text-[9px] text-slate-500">{new Date(log.syncTime).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500">{log.recordsSynced} rows ingested</span>
                                        {log.status === "success" ? (
                                            <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-medium">
                                                <CheckCircle2 className="w-3 h-3" /> success
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-medium" title={log.error || undefined}>
                                                <AlertCircle className="w-3 h-3" /> failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isAddOpen && (
                <AddConnectorModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                />
            )}
        </main>
    )
}
