"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
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
import { Users, ShieldAlert, Lock, UserCheck2, RefreshCw } from "lucide-react"

// Phase 10 Imports
import { getValidShareLink, getValidInvitation, acceptInvitation } from "@/services/sharing/sharing.service"
import { useDashboardPermission } from "@/hooks/use-dashboard-permission"
import { MockIdentityBar, MockUser, MOCK_USERS } from "@/components/collaboration/mock-identity-bar"
import { ShareModal } from "@/components/collaboration/share-modal"
import { CommentsPanel } from "@/components/collaboration/comments-panel"

export default function CollaborativeDashboardPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const dashboardId = params.id as string

    // Simulation Identity
    const [currentUser, setCurrentUser] = useState<MockUser>(() => MOCK_USERS[0])

    // Active collaborators
    const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])

    // Core states
    const [dashboard, setDashboard] = useState<Dashboard | null>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [errorScreen, setErrorScreen] = useState<"none" | "expired" | "locked" | "denied">("none")

    // Shared & Invitation Token States
    const [shareLinkPermission, setShareLinkPermission] = useState<"viewer" | "editor" | null>(null)
    const [resolvedInvite, setResolvedInvite] = useState<{ role: "viewer" | "editor"; token: string } | null>(null)

    // Data Mapping states
    const [rawDataMap, setRawDataMap] = useState<Record<string, any[]>>({})
    const [processedDataMap, setProcessedDataMap] = useState<Record<string, any[]>>({})

    // 1. Hook up permission resolver
    const { role: userRole, canEdit, canView, canManageShare } = useDashboardPermission(
        dashboard,
        currentUser.uid,
        shareLinkPermission
    )

    // ── 2. Run token resolution & load dashboard ──────────────────────────
    useEffect(() => {
        const initialize = async () => {
            setLoading(true)
            setErrorScreen("none")

            try {
                // A. Resolve Expiring Share Token
                const shareToken = searchParams.get("shareToken")
                let resolvedPerm: "viewer" | "editor" | null = null

                if (shareToken) {
                    const validLink = await getValidShareLink(shareToken)
                    if (!validLink) {
                        setErrorScreen("expired")
                        setLoading(false)
                        return
                    }
                    resolvedPerm = validLink.permission
                    setShareLinkPermission(validLink.permission)
                }

                // B. Resolve Team Invite Token
                const inviteToken = searchParams.get("inviteToken")
                if (inviteToken) {
                    const validInvite = await getValidInvitation(inviteToken)
                    if (validInvite) {
                        setResolvedInvite({ role: validInvite.role, token: inviteToken })
                    }
                }

                // C. Load Dashboard subscription
                const initBlank = async () => {
                    const blank: Dashboard = {
                        id: dashboardId,
                        name: `Dashboard — ${dashboardId}`,
                        widgets: [],
                        filters: [],
                        ownerId: "alice_owner_10", // Default Alice to owner on initial generate
                        publicAccess: "private",
                        teamPermissions: {},
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    }
                    await saveDashboard(blank)
                }

                const unsubscribe = subscribeToDashboard(dashboardId, (data) => {
                    setDashboard(data)
                    setLoading(false)
                })

                // Auto-generate if no doc returned in 1.5 seconds
                const timer = setTimeout(() => {
                    setDashboard(prev => {
                        if (!prev && !shareToken) {
                            initBlank()
                        }
                        return prev
                    })
                }, 1500)

                return () => {
                    clearTimeout(timer)
                    try { unsubscribe() } catch (_) {}
                }
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }

        initialize()
    }, [dashboardId, searchParams])

    // ── 3. Handle Presence Join ───────────────────────────────────────────
    useEffect(() => {
        if (loading || errorScreen !== "none" || !canView) return
        
        const userPresence: UserPresence = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            color: currentUser.color
        }

        const unsubscribe = joinDashboardPresence(dashboardId, userPresence, setActiveUsers)
        return () => { try { unsubscribe() } catch (_) {} }
    }, [dashboardId, currentUser, loading, errorScreen, canView])

    // ── 4. Retrieve Widget Datasets ──────────────────────────────────────
    useEffect(() => {
        if (!dashboard || !canView) return
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
    }, [dashboard?.widgets, canView])

    // ── 5. Run Global Query Filters ───────────────────────────────────────
    useEffect(() => {
        if (!dashboard || !canView) return
        const processed: Record<string, any[]> = {}
        for (const [datasetId, rows] of Object.entries(rawDataMap)) {
            processed[datasetId] = dashboard.filters.length > 0
                ? executeQuery(rows, { filters: dashboard.filters }).rows
                : rows
        }
        setProcessedDataMap(processed)
    }, [dashboard?.filters, rawDataMap, canView])

    // ── Helpers ───────────────────────────────────────────────────────────
    async function persist(patch: Partial<Dashboard>) {
        if (!dashboard || !canEdit) return
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
        if (!dashboard || !canEdit) return
        persist({ widgets: [...dashboard.widgets, widget] })
    }

    function handleFiltersChange(filters: DashboardFilter[]) {
        persist({ filters })
    }

    async function handleAcceptInvite() {
        if (!resolvedInvite) return;
        try {
            await acceptInvitation(resolvedInvite.token, currentUser.uid, currentUser.displayName, currentUser.email);
            // Strip token parameters from URL to load normal permission layout
            router.replace(`/dashboard-builder/${dashboardId}`);
            setResolvedInvite(null);
        } catch (e) {
            alert("Failed to accept invitation");
        }
    }

    // ── Loading screen ───────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-muted-foreground text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm font-medium">Resolving dashboard access configurations...</p>
                </div>
            </main>
        )
    }

    // ── Error: Expired Share Links ──────────────────────────────────────
    if (errorScreen === "expired") {
        return (
            <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                <div className="border border-border rounded-2xl bg-card text-card-foreground p-8 max-w-md w-full text-center shadow-xl space-y-4 border-red-500/25">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold">Share Link Expired</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This temporary link has expired or has been explicitly revoked by the owner. Please request a new sharing URL from the team owner.
                    </p>
                    <button onClick={() => router.push("/")} className="w-full bg-slate-800 text-white rounded-xl py-2 font-medium text-xs hover:bg-slate-700 cursor-pointer">
                        Go Back to Home
                    </button>
                </div>
            </main>
        )
    }

    // ── Error: Private Locked (Access Denied) ───────────────────────────
    if (!canView || errorScreen === "locked" || userRole === "none") {
        return (
            <div className="flex flex-col min-h-screen">
                <MockIdentityBar 
                    activeUser={currentUser} 
                    onSelectUser={setCurrentUser} 
                    currentResolvedRole="NONE" 
                />
                <main className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="border border-border rounded-2xl bg-card text-card-foreground p-8 max-w-md w-full text-center shadow-xl space-y-5">
                        <Lock className="w-12 h-12 text-indigo-500 mx-auto animate-bounce" />
                        <h2 className="text-xl font-bold">Private Dashboard</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This dashboard is locked in Private Mode. Only explicit team collaborators can access its contents.
                        </p>
                        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-600 dark:text-indigo-400">
                            💡 Toggle your identity simulator above to <strong>Alice (Owner)</strong> or a Team Member to join!
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Permission System Simulator Header */}
            <MockIdentityBar 
                activeUser={currentUser} 
                onSelectUser={setCurrentUser} 
                currentResolvedRole={userRole} 
            />

            <LiveCursors
                dashboardId={dashboardId}
                currentUser={{ uid: currentUser.uid, displayName: currentUser.displayName, color: currentUser.color }}
                activeUsers={activeUsers}
            >
                <main className="p-8 space-y-6">
                    
                    {/* ── Top Bar ── */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <input
                                    disabled={!canEdit}
                                    value={dashboard?.name}
                                    onChange={(e) => persist({ name: e.target.value })}
                                    className={`text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-border w-full truncate ${!canEdit ? "cursor-not-allowed text-slate-400" : "text-foreground"}`}
                                    placeholder="Dashboard Name"
                                />
                                {!canEdit && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-amber-950/40 dark:text-amber-300 select-none shrink-0">
                                        Viewer Mode
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Role: <span className="text-indigo-500 font-semibold">{userRole.toUpperCase()}</span> • 
                                {canEdit ? " Realtime editing active" : " Read-only view only"}
                                {isSaving && <span className="ml-2 text-indigo-500 animate-pulse">Saving…</span>}
                            </p>
                        </div>

                        {/* Presence Avatars */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{activeUsers.length} online</span>
                            </div>
                            <div className="flex -space-x-2">
                                {activeUsers.map(u => (
                                    <div
                                        key={u.uid}
                                        title={u.displayName + (u.uid === currentUser.uid ? " (you)" : "")}
                                        className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all duration-300"
                                        style={{ backgroundColor: u.color }}
                                    >
                                        {u.displayName[0]}
                                    </div>
                                ))}
                            </div>
                            <DashboardToolbar
                                onSave={() => persist({})}
                                onAddWidget={() => setIsAddModalOpen(true)}
                                canEdit={canEdit}
                                canShare={canManageShare}
                                onOpenShare={() => setIsShareModalOpen(true)}
                            />
                        </div>
                    </div>

                    {/* ── Global Filters ── */}
                    <GlobalFilters
                        filters={dashboard?.filters || []}
                        onChange={handleFiltersChange}
                    />

                    {/* ── Widget Grid ── */}
                    {dashboard?.widgets.length === 0 ? (
                        <div className="border-2 border-dashed border-border rounded-2xl p-20 text-center text-muted-foreground">
                            <p className="text-lg font-medium mb-2 text-foreground">No widgets yet</p>
                            {canEdit ? (
                                <>
                                    <p className="text-sm">Click &quot;Add Widget&quot; above to add your first chart</p>
                                    <p className="text-xs mt-2 opacity-60">Other collaborators will see changes instantly</p>
                                </>
                            ) : (
                                <p className="text-sm">Wait for editors to populate widgets for this dashboard</p>
                            )}
                        </div>
                    ) : (
                        <DashboardGrid
                            widgets={dashboard?.widgets || []}
                            dataMap={processedDataMap}
                            isEditable={canEdit}
                        />
                    )}

                    {/* ── Invite Accept Confirmation Card ── */}
                    {resolvedInvite && (
                        <div className="fixed bottom-6 left-6 max-w-sm w-full bg-card text-card-foreground border border-indigo-500 shadow-2xl p-4 z-40 space-y-3 rounded-2xl animate-fade-in">
                            <div className="flex items-center gap-2 text-indigo-500">
                                <UserCheck2 className="w-5 h-5" />
                                <span className="font-semibold text-xs">Collaboration Invite</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                You have been invited to collaborate as an <strong className="text-indigo-400 capitalize">{resolvedInvite.role}</strong>. Accept and bind to your account?
                            </p>
                            <div className="flex gap-2">
                                <button onClick={handleAcceptInvite} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 font-medium text-xs cursor-pointer">
                                    Accept Invite
                                </button>
                                <button onClick={() => setResolvedInvite(null)} className="px-3 border border-border rounded-lg hover:bg-muted text-xs cursor-pointer text-foreground">
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Add Widget Modal ── */}
                    <AddWidgetModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAddWidget}
                    />

                    {/* ── Share Modal ── */}
                    {dashboard && (
                        <ShareModal
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                            dashboard={dashboard}
                            currentUserUid={currentUser.uid}
                            onRefreshDashboard={() => {
                                setDashboard({ ...dashboard });
                            }}
                        />
                    )}

                    {/* ── Realtime Comments Thread Panel ── */}
                    <CommentsPanel 
                        dashboardId={dashboardId} 
                        userName={currentUser.displayName} 
                        userColor={currentUser.color} 
                    />
                </main>
            </LiveCursors>
        </div>
    )
}
