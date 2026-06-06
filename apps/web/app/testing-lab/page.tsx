"use client"

import { useState } from "react"
import { ShieldAlert, TerminalSquare, Bug, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"

function CrashingComponent() {
    throw new Error("Simulated UI Component Crash!")
    return <div>Never renders</div>
}

export default function TestingLabPage() {
    const [crashUI, setCrashUI] = useState(false)
    const [apiLogs, setApiLogs] = useState<string[]>([])

    const triggerApiCrash = async () => {
        setApiLogs(prev => [...prev, "[GET] Calling /api/test/crash..."])
        try {
            const res = await fetch("/api/test/crash")
            const data = await res.json()
            setApiLogs(prev => [...prev, `Response Status: ${res.status}`, `Data: ${JSON.stringify(data)}`])
            if (!res.ok) {
                toast.error("API returned an error (expected)")
            }
        } catch (e: any) {
            setApiLogs(prev => [...prev, `Fetch Exception: ${e.message}`])
        }
    }

    const testLogger = async () => {
        setApiLogs(prev => [...prev, "[POST] Triggering structured log test..."])
        try {
            const res = await fetch("/api/test/log", { method: "POST" })
            const data = await res.json()
            if (data.success) {
                toast.success("Structured logs emitted to server console!")
                setApiLogs(prev => [...prev, "✅ Check your terminal/console for JSON formatted logs!"])
            }
        } catch (e: any) {
            setApiLogs(prev => [...prev, `Error: ${e.message}`])
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldAlert className="text-indigo-500 h-8 w-8" />
                        Testing &amp; Stabilization Lab
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Phase 14: Verify error boundaries, structured logging, and API error handling.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. React Error Boundaries */}
                    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <Bug className="text-red-400 h-5 w-5" />
                            React Error Boundaries
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Test how the application handles unexpected React render crashes without unmounting the whole app.
                        </p>

                        <div className="p-4 border border-slate-800 rounded-lg mb-4 min-h-[150px] flex items-center justify-center">
                            <ErrorBoundary>
                                {crashUI ? (
                                    <CrashingComponent />
                                ) : (
                                    <div className="text-slate-500 flex flex-col items-center">
                                        <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                                        <span>Component running normally</span>
                                    </div>
                                )}
                            </ErrorBoundary>
                        </div>

                        <button
                            onClick={() => setCrashUI(true)}
                            disabled={crashUI}
                            className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Trigger UI Crash
                        </button>
                        {crashUI && (
                            <button
                                onClick={() => setCrashUI(false)}
                                className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                                Reset Component
                            </button>
                        )}
                    </section>

                    {/* 2. Logging & API Handling */}
                    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <TerminalSquare className="text-emerald-400 h-5 w-5" />
                            API Error &amp; Logging
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Test structured logging and unhandled server-side API exceptions.
                        </p>

                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={triggerApiCrash}
                                className="flex-1 py-2 bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 border border-orange-900/50 rounded-lg transition-colors cursor-pointer"
                            >
                                Test API Crash (500)
                            </button>
                            <button
                                onClick={testLogger}
                                className="flex-1 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-900/50 rounded-lg transition-colors cursor-pointer"
                            >
                                Emit Structured Log
                            </button>
                        </div>

                        <div className="bg-black/60 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-400 h-48 overflow-y-auto">
                            {apiLogs.length === 0 && <span className="text-slate-600">Terminal output will appear here...</span>}
                            {apiLogs.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Status Summary */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-slate-200 mb-4">Phase 14 Verification Checklist</h2>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> <strong className="text-slate-200">Error Boundary:</strong> UI crash is caught, fallback shown, page stays alive</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> <strong className="text-slate-200">API Error (500):</strong> Server throws intentionally, response captured in log</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> <strong className="text-slate-200">Structured Logging:</strong> JSON logs with timestamp, level, message emitted to server console</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> <strong className="text-slate-200">Global Error Page:</strong> <code className="text-xs bg-slate-800 px-1 rounded">global-error.tsx</code> exists as final safety net</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> <strong className="text-slate-200">Sentry Configs:</strong> Client, server, and edge config files in place (requires DSN to activate)</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
