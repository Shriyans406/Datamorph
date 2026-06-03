"use client"

import { useState, useEffect } from "react"
import { FileText, FileSpreadsheet, Download, Calendar, Play, Trash2, RefreshCw, Layers, Loader2, Database } from "lucide-react"
import { exportToCSV, exportToExcel } from "@/services/export/csv-excel-export"
import { generateDashboardPDF, exportWidgetAsPNG } from "@/services/export/pdf-export"
import { createReportSchedule, getDashboardSchedules, deleteReportSchedule, ScheduledReport } from "@/services/export/report-scheduler"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, deleteDoc, doc } from "firebase/firestore"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────
interface RealDataset {
    id: string
    metadata?: { name?: string; rows?: number; columns?: number }
    rows?: any[]
    widgets?: any[]
    name?: string
}

export default function ExportTestPage() {
    // Real Firestore data
    const [datasets, setDatasets] = useState<RealDataset[]>([])
    const [dashboards, setDashboards] = useState<any[]>([])
    const [selectedDashboardId, setSelectedDashboardId] = useState<string>("")
    const [selectedDashboard, setSelectedDashboard] = useState<any>(null)
    const [dataMap, setDataMap] = useState<Record<string, any[]>>({})
    const [loadingData, setLoadingData] = useState(true)

    // Schedule form
    const [email, setEmail] = useState("")
    const [format, setFormat] = useState<"pdf" | "excel" | "csv">("pdf")
    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily")
    const [schedules, setSchedules] = useState<ScheduledReport[]>([])
    const [emailsLog, setEmailsLog] = useState<any[]>([])
    const [selectedEmail, setSelectedEmail] = useState<any>(null)
    const [isTriggeringCron, setIsTriggeringCron] = useState(false)
    const [loadingSchedules, setLoadingSchedules] = useState(true)

    // ── 1. Load real datasets & dashboards from Firestore ─────────────────
    useEffect(() => {
        const unsubDatasets = onSnapshot(collection(db, "datasets"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RealDataset[]
            setDatasets(list)
            // Build dataMap: datasetId -> rows
            const map: Record<string, any[]> = {}
            list.forEach(ds => { map[ds.id] = ds.rows ?? [] })
            setDataMap(map)
        })

        const unsubDashboards = onSnapshot(collection(db, "dashboards"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setDashboards(list)
            if (list.length > 0 && !selectedDashboardId) {
                setSelectedDashboardId(list[0].id)
            }
            setLoadingData(false)
        }, () => setLoadingData(false))

        return () => { unsubDatasets(); unsubDashboards() }
    }, [])

    // ── 2. Keep selectedDashboard in sync ─────────────────────────────────
    useEffect(() => {
        const found = dashboards.find(d => d.id === selectedDashboardId)
        setSelectedDashboard(found ?? null)
    }, [selectedDashboardId, dashboards])

    // ── 3. Real-time schedules & email log ────────────────────────────────
    useEffect(() => {
        const qSchedules = query(collection(db, "scheduled_reports"))
        const unsubSchedules = onSnapshot(qSchedules, (snap) => {
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((s: any) => !selectedDashboardId || s.dashboardId === selectedDashboardId)
            setSchedules(data as ScheduledReport[])
            setLoadingSchedules(false)
        })

        const qEmails = query(collection(db, "dispatched_emails"))
        const unsubEmails = onSnapshot(qEmails, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.sentAt - a.sentAt)
            setEmailsLog(list)
            if (list.length > 0 && !selectedEmail) {
                setSelectedEmail(list[0])
            }
        })

        return () => { unsubSchedules(); unsubEmails() }
    }, [selectedDashboardId])

    // ── Export Handlers (real data) ───────────────────────────────────────
    const handleInstantCSV = () => {
        if (!selectedDashboard || (selectedDashboard.widgets ?? []).length === 0) {
            // Fallback: export all datasets as CSV
            if (datasets.length === 0) { toast.error("No data available"); return }
            toast.info("Downloading all datasets as CSV...")
            datasets.forEach(ds => {
                const rows = ds.rows ?? []
                if (rows.length === 0) return
                const headers = Object.keys(rows[0])
                exportToCSV(`${ds.metadata?.name ?? ds.id}.csv`, headers, rows.map(r => headers.map(h => r[h])))
            })
            toast.success("CSV files downloaded!")
            return
        }
        toast.info("Downloading CSV for dashboard widgets...")
        selectedDashboard.widgets.forEach((w: any) => {
            const rows = dataMap[w.datasetId] ?? []
            if (rows.length === 0) return
            const headers = Object.keys(rows[0])
            exportToCSV(`${w.title ?? "widget"}_data.csv`, headers, rows.map(r => headers.map(h => r[h])))
        })
        toast.success("CSV files downloaded!")
    }

    const handleInstantExcel = () => {
        if (datasets.length === 0) { toast.error("No datasets available"); return }
        toast.info("Downloading datasets as Excel sheets...")
        const sheets = datasets
            .filter(ds => (ds.rows ?? []).length > 0)
            .map(ds => {
                const rows = ds.rows ?? []
                const headers = Object.keys(rows[0])
                return { name: (ds.metadata?.name ?? ds.id).substring(0, 30), headers, rows: rows.map(r => headers.map(h => r[h])) }
            })
        if (sheets.length === 0) { toast.error("No row data in any dataset"); return }
        exportToExcel("datamorph_export", sheets)
        toast.success("Excel sheets downloaded!")
    }

    const handleInstantPDF = async () => {
        if (!selectedDashboard) { toast.error("Please select a dashboard first"); return }
        toast.info("Rendering PDF report...")
        try {
            await generateDashboardPDF({
                dashboardName: selectedDashboard.name ?? "Dashboard",
                widgets: selectedDashboard.widgets ?? [],
                dataMap
            })
            toast.success("PDF Report generated!")
        } catch (e) {
            toast.error("Failed to render PDF")
        }
    }

    const handleCreateSchedule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            toast.error("Valid email required")
            return
        }
        if (!selectedDashboard) { toast.error("Select a dashboard first"); return }
        try {
            await createReportSchedule({
                dashboardId: selectedDashboard.id,
                dashboardName: selectedDashboard.name ?? "Dashboard",
                userId: "test-user-admin",
                email,
                format,
                frequency
            })
            toast.success("Schedule registered!")
            setEmail("")
        } catch {
            toast.error("Failed to register schedule")
        }
    }

    const handleDeleteSchedule = async (id: string) => {
        try {
            await deleteReportSchedule(id)
            toast.success("Schedule deleted!")
        } catch {
            toast.error("Deletion failed")
        }
    }

    const handleTriggerCron = async () => {
        if (!selectedDashboard) { toast.error("Select a dashboard first"); return }
        setIsTriggeringCron(true)
        toast.info("Executing server-side cron engine...")
        try {
            const res = await fetch(`/api/reports/cron?simulate=true&dashboardId=${selectedDashboard.id}`, {
                method: "POST"
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Cron finished! Dispatched ${data.processedCount} email reports.`)
            } else {
                toast.error("Cron failed: " + data.error)
            }
        } catch {
            toast.error("Server API route failed")
        } finally {
            setIsTriggeringCron(false)
        }
    }

    const handleClearEmails = async () => {
        toast.info("Clearing SMTP logs...")
        const promises = emailsLog.map(e => deleteDoc(doc(db, "dispatched_emails", e.id)))
        await Promise.all(promises)
        setSelectedEmail(null)
        toast.success("Outbox logs deleted!")
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Layers className="text-indigo-500" />
                        Phase 11 — Export & Reporting Verification Panel
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        All data is live from Firestore — no mock values.
                    </p>
                </div>
            </div>

            {/* Dashboard Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <Database className="w-4 h-4 text-indigo-400" />
                    Active Dashboard:
                </div>
                {loadingData ? (
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        Loading Firestore data...
                    </div>
                ) : dashboards.length === 0 ? (
                    <p className="text-xs text-slate-500">No dashboards found — create one in Dashboard Builder first</p>
                ) : (
                    <select
                        value={selectedDashboardId}
                        onChange={e => setSelectedDashboardId(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                        {dashboards.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name ?? d.id} ({d.widgets?.length ?? 0} widgets)
                            </option>
                        ))}
                    </select>
                )}
                <span className="text-xs text-slate-600">{datasets.length} dataset(s) in Firestore</span>
            </div>

            {/* Live Preview of real widget data */}
            {selectedDashboard && (selectedDashboard.widgets ?? []).length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Dashboard Widget Preview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(selectedDashboard.widgets ?? []).map((w: any) => {
                            const rows = dataMap[w.datasetId] ?? []
                            return (
                                <div
                                    key={w.id}
                                    data-widget-id={w.id}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-72 hover:border-slate-700 transition-all"
                                >
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-4">
                                            <h4 className="font-semibold text-xs text-slate-200">{w.title ?? w.id}</h4>
                                            <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 font-semibold px-2 py-0.5 rounded-md uppercase">
                                                {w.type ?? "widget"}
                                            </span>
                                        </div>
                                        {rows.length === 0 ? (
                                            <p className="text-xs text-slate-600 text-center py-8">No data for this widget</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-[10px] text-slate-400">
                                                    <thead>
                                                        <tr className="border-b border-slate-800/50">
                                                            {Object.keys(rows[0]).slice(0, 4).map(h => (
                                                                <th key={h} className="pb-1 font-semibold text-slate-400 pr-2">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rows.slice(0, 5).map((row: any, idx: number) => (
                                                            <tr key={idx} className="border-b border-slate-900/50 last:border-0">
                                                                {Object.keys(rows[0]).slice(0, 4).map((h, vIdx) => (
                                                                    <td key={vIdx} className="py-1 pr-2 truncate max-w-[60px]">
                                                                        {typeof row[h] === "number" && row[h] < 1 ? `${(row[h] * 100).toFixed(0)}%` : row[h]}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end pt-4 border-t border-slate-800/50 mt-4">
                                        <button
                                            onClick={() => exportWidgetAsPNG(w.id, w.title ?? "Widget View")}
                                            className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                                        >
                                            <Download className="w-3 h-3" /> Capture PNG
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Action + Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-white">1. Client-Side Instant Export Actions</h3>
                        <p className="text-xs text-slate-400 mt-1">Downloads use real Firestore data.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            onClick={handleInstantCSV}
                            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl p-4 text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                            <FileText className="w-6 h-6 text-emerald-400" />
                            Export Data to CSV
                        </button>
                        <button
                            onClick={handleInstantExcel}
                            className="bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl p-4 text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                            <FileSpreadsheet className="w-6 h-6 text-green-400" />
                            Export to Excel (.xlsx)
                        </button>
                        <button
                            onClick={handleInstantPDF}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl p-4 text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                            <FileText className="w-6 h-6 text-red-400" />
                            Generate Multipage PDF
                        </button>
                    </div>

                    <div className="border-t border-slate-800/80 pt-6 space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Register Delivery Schedules</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Saves recurring parameters in the active emulated datastore.</p>
                        </div>
                        <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@enterprise.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Format</label>
                                <select
                                    value={format}
                                    onChange={(e: any) => setFormat(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 cursor-pointer"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="excel">Excel</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 font-semibold text-xs cursor-pointer shadow-md transition-colors"
                            >
                                Schedule
                            </button>
                        </form>

                        <div className="bg-slate-950/60 rounded-xl border border-slate-800/60 p-4">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Schedules ({schedules.length})</h5>
                            {loadingSchedules ? (
                                <div className="flex justify-center py-4">
                                    <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                                </div>
                            ) : schedules.length === 0 ? (
                                <p className="text-[11px] text-slate-500 text-center py-2">No schedules configured.</p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {schedules.map(s => (
                                        <div key={s.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs">
                                            <div className="truncate pr-3">
                                                <span className="font-semibold text-slate-200">{s.email}</span>
                                                <span className="text-[10px] text-slate-400 ml-2">({s.format.toUpperCase()} • {s.frequency ?? "daily"})</span>
                                            </div>
                                            <button
                                                onClick={() => s.id && handleDeleteSchedule(s.id)}
                                                className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SMTP Log Outbox */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white">3. SMTP Log Outbox Simulator</h3>
                                <p className="text-xs text-slate-400 mt-1">Review scheduled mail attachments.</p>
                            </div>
                            <button
                                onClick={handleTriggerCron}
                                disabled={isTriggeringCron || !selectedDashboard}
                                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-2 text-xs font-semibold tracking-wide disabled:opacity-50 cursor-pointer shadow-md"
                            >
                                {isTriggeringCron ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                )}
                                Trigger Cron Job
                            </button>
                        </div>

                        {emailsLog.length === 0 ? (
                            <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500">
                                <p className="text-xs">No dispatched emails detected in emulator.</p>
                                <p className="text-[10px] mt-1 opacity-70">Register a schedule and trigger the Cron simulation.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 border border-slate-800 rounded-xl overflow-hidden h-96">
                                <div className="md:col-span-2 border-r border-slate-800 bg-slate-950/40 overflow-y-auto max-h-96 divide-y divide-slate-900">
                                    {emailsLog.map(email => (
                                        <button
                                            key={email.id}
                                            onClick={() => setSelectedEmail(email)}
                                            className={`w-full text-left p-3 text-xs block transition-all hover:bg-slate-900/60 cursor-pointer ${selectedEmail?.id === email.id ? "bg-indigo-500/10 border-l-2 border-indigo-500" : ""}`}
                                        >
                                            <div className="font-semibold text-slate-200 truncate">{email.to}</div>
                                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{email.subject}</div>
                                            <div className="text-[8px] text-slate-500 mt-1">{new Date(email.sentAt).toLocaleTimeString()}</div>
                                        </button>
                                    ))}
                                </div>

                                <div className="md:col-span-3 bg-slate-900 p-4 flex flex-col justify-between overflow-y-auto max-h-96">
                                    {selectedEmail ? (
                                        <div className="space-y-4">
                                            <div className="border-b border-slate-800/80 pb-3">
                                                <div className="text-xs text-slate-400">To: <span className="text-slate-100 font-semibold">{selectedEmail.to}</span></div>
                                                <div className="text-xs text-slate-400 mt-1">Subject: <span className="text-slate-200 font-medium">{selectedEmail.subject}</span></div>
                                                <div className="text-[9px] text-slate-500 mt-1">Dispatched: {new Date(selectedEmail.sentAt).toLocaleString()}</div>
                                            </div>
                                            <div className="text-xs whitespace-pre-wrap text-slate-300 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                                                {selectedEmail.body}
                                            </div>
                                            {selectedEmail.attachment && (
                                                <div className="bg-slate-950/80 border border-indigo-500/20 p-3 rounded-xl flex items-center justify-between">
                                                    <div className="min-w-0 pr-3">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachment</p>
                                                        <p className="text-[11px] text-slate-200 font-medium truncate mt-0.5">{selectedEmail.attachment.name}</p>
                                                    </div>
                                                    <a
                                                        href={selectedEmail.attachment.content}
                                                        download={selectedEmail.attachment.name}
                                                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                                    >
                                                        <Download className="w-3.5 h-3.5" /> Save File
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-20">Select an email to view content.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {emailsLog.length > 0 && (
                        <div className="flex justify-end border-t border-slate-800/50 pt-4">
                            <button
                                onClick={handleClearEmails}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 font-medium cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" /> Clear Logs Outbox
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
