"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { DashboardToolbar } from "@/components/dashboard/toolbar/dashboard-toolbar"
import { DashboardGrid } from "@/components/dashboard/layouts/dashboard-grid"
import { GlobalFilters } from "@/components/dashboard/filters/global-filters"
import { AddWidgetModal } from "@/components/dashboard/widgets/add-widget-modal"
import { LiveCursors } from "@/components/collaboration/live-cursors"
import { saveDashboard, subscribeToDashboard } from "@/services/dashboard/persistence/dashboard.persistence"
import { joinDashboardPresence, UserPresence } from "@/services/collaboration/collaboration.service"
import { executeQuery } from "@/services/datasets/query-engine/pipeline/execute-query"
import { getDatasetById } from "@/repositories/datasets/dataset.repository"
import { DashboardFilter, Dashboard } from "@/services/dashboard/types/dashboard.types"
import { Users } from "lucide-react"

// ── Deterministic user color from uid ─────────────────────────────────────────
const PALETTE = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
]

function makeSessionUser(): UserPresence {
    const uid = `user_${Math.random().toString(36).slice(2, 9)}`
    const names = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Drew"]
    const displayName = names[Math.floor(Math.random() * names.length)]
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
    return { uid, displayName, color }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CollaborativeDashboardPage() {
    const params = useParams()
    const dashboardId = params.id as string

    // Session identity (random guest — replace with real auth when ready)
    const [currentUser] = useState<UserPresence>(() => makeSessionUser())

    // Collaboration state
    const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])

    // Dashboard state (driven by Firestore onSnapshot)
    const [dashboard, setDashboard] = useState<Dashboard | null>(null)
    const [notFound, setNotFound] = useState(false)

    // Local UI state
    const [rawDataMap, setRawDataMap] = useState<Record<string, any[]>>({})
    const [processedDataMap, setProcessedDataMap] = useState<Record<string, any[]>>({})
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // ── 1. Join presence on RTDB ───────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = joinDashboardPresence(dashboardId, currentUser, setActiveUsers)
        return () => { try { unsubscribe() } catch (_) { } }
    }, [dashboardId, currentUser])

    // ── 2. Subscribe to Firestore dashboard doc (real-time sync) ───────────
    useEffect(() => {
        // If the doc doesn't exist yet, create a blank one and then listen
        const init = async () => {
            const blank: Dashboard = {
                id: dashboardId,
                name: `Dashboard — ${dashboardId}`,
                widgets: [],
                filters: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
            await saveDashboard(blank)
        }

        const unsubscribe = subscribeToDashboard(dashboardId, (data) => {
            setDashboard(data)
        })

        // Give Firestore 1.5 s to return the doc before we auto-create it
        const timer = setTimeout(() => {
            setDashboard(prev => {
                if (!prev) {
                    init()
                    return null
                }
                return prev
            })
        }, 1500)

        return () => {
            clearTimeout(timer)
            try { unsubscribe() } catch (_) { }
        }
    }, [dashboardId])

    // ── 3. Fetch dataset rows for each widget ──────────────────────────────
    useEffect(() => {
        if (!dashboard) return
        const uniqueIds = Array.from(new Set(dashboard.widgets.map(w => w.datasetId)))
        const missingIds = uniqueIds.filter(id => !rawDataMap[id])
        if (missingIds.length === 0) return

        Promise.all(
            missingIds.map(id =>
                getDatasetById(id).then(ds => ({ id, rows: ds?.rows ?? [] }))
            )
        ).then(results => {
            setRawDataMap(prev => {
                const updated = { ...prev }
                results.forEach(({ id, rows }) => { updated[id] = rows })
                return updated
            })
        })
    }, [dashboard?.widgets])

    // ── 4. Apply global filters ────────────────────────────────────────────
    useEffect(() => {
        if (!dashboard) return
        const processed: Record<string, any[]> = {}
        for (const [datasetId, rows] of Object.entries(rawDataMap)) {
            processed[datasetId] = dashboard.filters.length > 0
                ? executeQuery(rows, { filters: dashboard.filters }).rows
                : rows
        }
        setProcessedDataMap(processed)
    }, [dashboard?.filters, rawDataMap])

    // ── Helpers ────────────────────────────────────────────────────────────
    async function persist(patch: Partial<Dashboard>) {
        if (!dashboard) return
        const updated: Dashboard = {
            ...dashboard,
            ...patch,
            updatedAt: Date.now(),
        }
        setIsSaving(true)
        try {
            await saveDashboard(updated)
        } finally {
            setIsSaving(false)
        }
    }

    function handleAddWidget(widget: any) {
        if (!dashboard) return
        persist({ widgets: [...dashboard.widgets, widget] })
    }

    function handleFiltersChange(filters: DashboardFilter[]) {
        persist({ filters })
    }

    // ── Loading ────────────────────────────────────────────────────────────
    if (!dashboard) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Connecting to collaborative session…</p>
                </div>
            </main>
        )
    }

    return (
        <LiveCursors
            dashboardId={dashboardId}
            currentUser={currentUser}
            activeUsers={activeUsers}
        >
            <main className="p-8 space-y-6">
                {/* ── Top Bar ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 flex-1 min-w-0">
                        <input
                            value={dashboard.name}
                            onChange={(e) => persist({ name: e.target.value })}
                            className="text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-border w-full truncate"
                            placeholder="Dashboard Name"
                        />
                        <p className="text-muted-foreground text-sm">
                            Collaborative • All changes sync in real-time
                            {isSaving && <span className="ml-2 text-indigo-500 animate-pulse">Saving…</span>}
                        </p>
                    </div>

                    {/* Presence Avatars */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{activeUsers.length} online</span>
                        </div>
                        <div className="flex -space-x-2">
                            {activeUsers.map(u => (
                                <div
                                    key={u.uid}
                                    title={u.displayName + (u.uid === currentUser.uid ? " (you)" : "")}
                                    className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                    style={{ backgroundColor: u.color }}
                                >
                                    {u.displayName[0]}
                                </div>
                            ))}
                        </div>
                        <DashboardToolbar
                            onSave={() => persist({})}
                            onAddWidget={() => setIsAddModalOpen(true)}
                        />
                    </div>
                </div>

                {/* ── Global Filters ── */}
                <GlobalFilters
                    filters={dashboard.filters}
                    onChange={handleFiltersChange}
                />

                {/* ── Widget Grid ── */}
                {dashboard.widgets.length === 0 ? (
                    <div className="border-2 border-dashed rounded-2xl p-20 text-center text-muted-foreground">
                        <p className="text-lg font-medium mb-2">No widgets yet</p>
                        <p className="text-sm">Click &quot;Add Widget&quot; above to add your first chart</p>
                        <p className="text-xs mt-2 opacity-60">Other collaborators will see changes instantly</p>
                    </div>
                ) : (
                    <DashboardGrid
                        widgets={dashboard.widgets}
                        dataMap={processedDataMap}
                    />
                )}

                {/* ── Add Widget Modal ── */}
                <AddWidgetModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddWidget}
                />
            </main>
        </LiveCursors>
    )
}
