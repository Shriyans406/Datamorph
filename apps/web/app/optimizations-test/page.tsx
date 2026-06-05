"use client"

import { useState, useEffect, useRef } from "react"
import { Zap, Database, Table, Brain, FolderArchive, Play, RefreshCw, BarChart, CheckCircle } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore"
import { toast } from "sonner"
import { getDatasets } from "@/repositories/datasets/dataset.repository"
import { DatasetTable } from "@/components/datasets/dataset-table"

export default function OptimizationsTestPage() {
    const [loading, setLoading] = useState(false)

    // Virtualization Demonstration State
    const [virtualized, setVirtualized] = useState(true)
    const [itemCount, setItemCount] = useState(500)
    const [renderRows, setRenderRows] = useState<any[]>([])

    // Cache tracking metrics
    const [apiCallCount, setApiCallCount] = useState(0)
    const [cacheHitCount, setCacheHitCount] = useState(0)
    const [lastResponseSource, setLastResponseSource] = useState<string | null>(null)

    // Throttling demonstration
    const [queueLogs, setQueueLogs] = useState<string[]>([])

    // Load massive test dataset on-demand
    const handleGenerateLargeDataset = () => {
        const list = []
        for (let i = 1; i <= itemCount; i++) {
            list.push({
                "Index": i,
                "Unique ID": `ROW-${Math.floor(Math.random() * 1000000)}`,
                "Metric Value": (Math.random() * 1000).toFixed(2),
                "Category Code": ["ALPHA", "BETA", "GAMMA", "OMEGA"][i % 4],
                "Data Integrity Flag": Math.random() > 0.1 ? "VALID" : "CORRUPT"
            })
        }
        setRenderRows(list)
        toast.success(`Generated ${itemCount} in-memory rows. Scroll below to test rendering!`)
    }

    const testAIQueryWithCache = async (queryText: string) => {
        setLoading(true)
        setQueueLogs(prev => [...prev, `[INIT] Dispatching query: "${queryText}"`])
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "query",
                    naturalLanguageQuery: queryText,
                    columns: ["Index", "Unique ID", "Metric Value"]
                })
            })
            const data = await res.json()
            if (data.source === "cache") {
                setCacheHitCount(c => c + 1)
                setLastResponseSource("Cache (Instant)")
            } else {
                setApiCallCount(a => a + 1)
                setLastResponseSource("Gemini API (1s spaced delay)")
            }
            setQueueLogs(prev => [...prev, `[DONE] Resolved via: ${data.source.toUpperCase()}`])
        } catch (err: any) {
            setQueueLogs(prev => [...prev, `[FAIL] Error: ${err.message}`])
        } finally {
            setLoading(false)
        }
    }

    const triggerBatchAIThrottlingTest = async () => {
        setQueueLogs([])
        toast.info("Dispatching 4 parallel queries. Watch logs to verify queue serialization...")

        // Dispatch queries concurrently to verify rate limits and serialization spacing
        const queries = [
            "show values where value > 500",
            "show values where value > 500", // Duplicate input (Cache Hit candidate)
            "find unhealthy items",
            "calculate average metrics"
        ]

        queries.forEach((q, idx) => {
            setTimeout(() => {
                testAIQueryWithCache(q)
            }, idx * 50)
        })
    }

    const triggerStorageLogArchival = async () => {
        setLoading(true)
        toast.info("Triggering sync route to execute expired logs cleanup...")
        try {
            const res = await fetch("/api/connectors/sync", { method: "POST" })
            const data = await res.json()
            if (data.success) {
                toast.success("Logs cleaner run successfully! Deleted logs older than 7 days.")
            } else {
                toast.error("Cleanup failed: " + data.error)
            }
        } catch {
            toast.error("Network sync trigger failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                        Phase 13 — Performance & Cost Optimization Laboratory
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Verify rendering speeds, Firestore connection limits, AI cache hit metrics, and log archival runs.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Virtualization Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Table className="w-4 h-4 text-indigo-400" />
                            1. Virtualization & DOM Render Speeds
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Virtualization:</span>
                            <button
                                onClick={() => setVirtualized(!virtualized)}
                                className={`text-[10px] font-bold border px-2 py-0.5 rounded cursor-pointer transition-all ${virtualized ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" : "bg-slate-950 text-slate-500 border-slate-800"}`}
                            >
                                {virtualized ? "ENABLED" : "DISABLED"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 border border-slate-800/80 rounded-xl">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">In-Memory Rows:</span>
                            <input
                                type="number"
                                value={itemCount}
                                onChange={e => setItemCount(Math.min(10000, Number(e.target.value)))}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 mt-1 text-slate-100 font-mono focus:outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateLargeDataset}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 font-bold text-xs cursor-pointer shadow-md transition-all"
                            >
                                Generate Grid
                            </button>
                        </div>
                    </div>

                    {renderRows.length > 0 ? (
                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                            {virtualized ? (
                                <DatasetTable rows={renderRows} />
                            ) : (
                                <div className="overflow-auto max-h-[400px]">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-900 sticky top-0 text-slate-300">
                                            <tr>
                                                {Object.keys(renderRows[0]).map(k => (
                                                    <th key={k} className="p-2.5 text-left border-r border-slate-800">{k}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {renderRows.map((row, idx) => (
                                                <tr key={idx} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/30">
                                                    {Object.keys(renderRows[0]).map(k => (
                                                        <td key={k} className="p-2.5 text-slate-400 border-r border-slate-900 truncate max-w-[150px]">{String(row[k])}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="bg-slate-900/40 p-3 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                                <span>Total Rows: {renderRows.length}</span>
                                <span>Rendered DOM Nodes: {virtualized ? Math.min(renderRows.length, 15) * Object.keys(renderRows[0]).length : renderRows.length * Object.keys(renderRows[0]).length} nodes</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 py-10 text-center border border-dashed border-slate-800 rounded-xl">
                            Click Generate Grid to test scroll rendering performance.
                        </p>
                    )}
                </div>

                {/* 2. AI Optimization Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        2. AI Throttling, Prompt Compression & Cache Hits
                    </h3>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-950 p-3 border border-slate-800/80 rounded-xl text-center">
                            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Cache Hits:</span>
                            <span className="text-xl font-bold text-emerald-400 font-mono">{cacheHitCount}</span>
                        </div>
                        <div className="bg-slate-950 p-3 border border-slate-800/80 rounded-xl text-center">
                            <span className="text-[9px] text-slate-500 uppercase block font-semibold">API Charges:</span>
                            <span className="text-xl font-bold text-indigo-400 font-mono">{apiCallCount}</span>
                        </div>
                        <div className="bg-slate-950 p-3 border border-slate-800/80 rounded-xl text-center">
                            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Last Source:</span>
                            <span className="text-[10px] font-bold text-slate-300 block mt-1.5 truncate" title={lastResponseSource || "None"}>
                                {lastResponseSource || "—"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parallel Query Dispatch Simulator</span>
                            <button
                                onClick={triggerBatchAIThrottlingTest}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Trigger Batch Run
                            </button>
                        </div>

                        <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto">
                            {queueLogs.length === 0 ? (
                                <p className="text-slate-600 italic">Logs console is empty. Launch a batch run to check throttling.</p>
                            ) : (
                                queueLogs.map((log, idx) => (
                                    <div key={idx} className="flex justify-between border-b border-slate-900 pb-1 last:border-0 text-slate-300">
                                        <span>{log}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Storage Pruning Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <FolderArchive className="w-4 h-4 text-indigo-400" />
                            3. Storage Optimization & Automatic Logs Archiving
                        </h3>
                        <button
                            onClick={triggerStorageLogArchival}
                            className="bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-xl px-4 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Run Archival Cleanup Now
                        </button>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-slate-200">Pruning Thresholds Configured</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                    All execution log runs under `connector_sync_logs` older than 7 calendar days are scanned and removed automatically. This saves index search speeds and document storage fees.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 border-t border-slate-900 pt-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-slate-200">Firestore Ingestion Slice Constraints</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                    Spreadsheets synced from external connectors limits row ingestions to `rows.slice(0, 500)` per sync run. This ensures documents stay securely below the 1MB Firestore single-document payload limit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
