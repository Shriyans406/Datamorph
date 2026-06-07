"use client"

import { useState } from "react"
import { ShieldCheck, Cloud, RefreshCw, Server, AlertTriangle, KeyRound, Radio } from "lucide-react"
import { toast } from "sonner"

export default function DeploymentLabPage() {
    const [healthStatus, setHealthStatus] = useState<any>(null)
    const [backupLogs, setBackupLogs] = useState<string[]>([])
    const [cronSecret, setCronSecret] = useState("")
    const [loadingHealth, setLoadingHealth] = useState(false)
    const [loadingBackup, setLoadingBackup] = useState(false)

    const checkHealth = async () => {
        setLoadingHealth(true)
        try {
            const res = await fetch("/api/health")
            const data = await res.json()
            setHealthStatus(data)
            toast.success("Health checks completed successfully!")
        } catch (e: any) {
            toast.error("Failed to query health endpoint")
            setHealthStatus({ status: "error", error: e.message })
        } finally {
            setLoadingHealth(false)
        }
    }

    const triggerBackup = async () => {
        setLoadingBackup(true)
        setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Requesting automated backup...`])
        try {
            const res = await fetch("/api/deployment/backup", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${cronSecret}`
                }
            })
            const data = await res.json()
            if (res.ok) {
                setBackupLogs(prev => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] Success: ${data.message}`,
                    `[${new Date().toLocaleTimeString()}] Collections archived: ${data.backedUpCollections.join(", ")}`
                ])
                toast.success("Database backup succeeded!")
            } else {
                setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error ${res.status}: ${data.error}`])
                toast.error(`Backup rejected: ${data.error}`)
            }
        } catch (e: any) {
            setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Exception: ${e.message}`])
            toast.error("Failed to trigger backup service")
        } finally {
            setLoadingBackup(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                            <ShieldCheck className="text-indigo-400 h-8 w-8" />
                            SaaS Production Deployment Control
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Verify telemetry, health diagnostics, backup automation, and CI/CD parameters.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-medium">
                        <Radio className="h-4 w-4 animate-pulse" />
                        Live Deployment Mode
                    </div>
                </header>

                {/* Diagnostic Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Health Monitor */}
                    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                                <Server className="text-emerald-400 h-5 w-5" />
                                Active Health Telemetry
                            </h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Validate real-time connectivity to Firestore and endpoint response.
                            </p>

                            {healthStatus ? (
                                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">System Status:</span>
                                        <span className={healthStatus.status === "healthy" ? "text-emerald-400" : "text-rose-400"}>
                                            {healthStatus.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Timestamp:</span>
                                        <span className="text-slate-300">{healthStatus.timestamp}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Next.js Service:</span>
                                        <span className="text-emerald-400">{healthStatus.services?.nextjs}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Database:</span>
                                        <span className="text-emerald-400">{healthStatus.services?.database}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-28 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
                                    Run diagnostics to display telemetry
                                </div>
                            )}
                        </div>

                        <button
                            onClick={checkHealth}
                            disabled={loadingHealth}
                            className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/10"
                        >
                            <RefreshCw className={`h-4 w-4 ${loadingHealth ? "animate-spin" : ""}`} />
                            Run Health Checks
                        </button>
                    </section>

                    {/* Backup Operator */}
                    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                                <Cloud className="text-indigo-400 h-5 w-5" />
                                Backup & Snapshot Engine
                            </h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Validate secure manual and scheduled Firestore snapshot triggers.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                        <KeyRound className="h-3.5 w-3.5" /> Secret Bearer Token
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter CRON_SECRET token..."
                                        value={cronSecret}
                                        onChange={(e) => setCronSecret(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={triggerBackup}
                            disabled={loadingBackup}
                            className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/10"
                        >
                            <Cloud className="h-4 w-4" />
                            Trigger Backup Snapshot
                        </button>
                    </section>

                    {/* Deployment Parameters */}
                    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                                <ShieldCheck className="text-blue-400 h-5 w-5" />
                                Deployment Configurations
                            </h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Verify critical configurations applied to our deployment package.
                            </p>

                            <ul className="space-y-2.5 text-sm">
                                <li className="flex items-center justify-between text-slate-300">
                                    <span>Vercel Platform Routing</span>
                                    <span className="text-emerald-400 font-semibold">Ready</span>
                                </li>
                                <li className="flex items-center justify-between text-slate-300">
                                    <span>CSP & Security Headers</span>
                                    <span className="text-emerald-400 font-semibold">Active</span>
                                </li>
                                <li className="flex items-center justify-between text-slate-300">
                                    <span>Production Database ID</span>
                                    <span className="text-indigo-400 font-mono text-xs">datamorph-7c835</span>
                                </li>
                                <li className="flex items-center justify-between text-slate-300">
                                    <span>CI/CD Workflow</span>
                                    <span className="text-emerald-400 font-semibold">Valid</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-6 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                                To check header enforcement, open your browser inspector network tab and view header response metadata.
                            </span>
                        </div>
                    </section>

                </div>

                {/* Live Logs console */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-200 mb-4">Deployment Engine Logs Console</h2>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-400 h-48 overflow-y-auto space-y-1">
                        {backupLogs.length === 0 ? (
                            <span className="text-slate-600">Operations log stream initialized. Awaiting triggers...</span>
                        ) : (
                            backupLogs.map((log, index) => (
                                <div key={index}>{log}</div>
                            ))
                        )}
                    </div>
                </section>

            </div>
        </div>
    )
}
