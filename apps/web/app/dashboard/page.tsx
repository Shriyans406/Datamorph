"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Plus, RefreshCw, Database, ArrowRight } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"

export default function DashboardPage() {
    const router = useRouter()
    const [dashboards, setDashboards] = useState<any[]>([])
    const [datasets, setDatasets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Real-time dashboards from Firestore
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "dashboards"), (snap) => {
            setDashboards(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        }, () => setLoading(false))
        return () => unsub()
    }, [])

    // Real-time dataset count
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "datasets"), (snap) => {
            setDatasets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return () => unsub()
    }, [])

    function handleNewDashboard() {
        const id = `db_${Date.now()}`
        router.push(`/dashboard-builder/${id}`)
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-indigo-400" />
                        DataMorph
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        AI-powered analytics platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/datasets"
                        className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
                    >
                        <Database className="w-3.5 h-3.5" />
                        Datasets ({datasets.length})
                    </Link>
                    <button
                        onClick={handleNewDashboard}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer shadow-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Dashboard
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: "Dashboards", value: dashboards.length, color: "text-indigo-400" },
                    { label: "Datasets", value: datasets.length, color: "text-emerald-400" },
                    { label: "Total Widgets", value: dashboards.reduce((a, d) => a + (d.widgets?.length ?? 0), 0), color: "text-violet-400" },
                ].map(stat => (
                    <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Dashboard List */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Saved Dashboards
                </h2>

                {loading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        Loading dashboards...
                    </div>
                ) : dashboards.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500">
                        <LayoutDashboard className="w-8 h-8 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No dashboards yet</p>
                        <p className="text-xs mt-1 opacity-60">Click "New Dashboard" above to create your first one</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboards.map((dash: any) => (
                            <button
                                key={dash.id}
                                onClick={() => router.push(`/dashboard-builder/${dash.id}`)}
                                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all group shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <h3 className="font-semibold text-sm text-slate-100 truncate">
                                    {dash.name || "Untitled Dashboard"}
                                </h3>
                                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                                    <span>{dash.widgets?.length ?? 0} widget{dash.widgets?.length !== 1 ? "s" : ""}</span>
                                    {dash.updatedAt && (
                                        <>
                                            <span>•</span>
                                            <span>Updated {new Date(dash.updatedAt).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}