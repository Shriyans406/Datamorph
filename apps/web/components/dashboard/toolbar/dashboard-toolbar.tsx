// Replace all contents in c:\Users\HP\OneDrive\Desktop\datamorph\apps\web\components\dashboard\toolbar\dashboard-toolbar.tsx
import { ExportDropdown } from "@/components/export/export-dropdown"

interface Props {
    onSave: () => void
    onAddWidget: () => void

    // Permission Props
    canEdit: boolean
    canShare: boolean
    onOpenShare: () => void

    // Phase 11 Export Props
    dashboard: any
    dataMap: Record<string, any[]>
}

export function DashboardToolbar({
    onSave,
    onAddWidget,
    canEdit,
    canShare,
    onOpenShare,
    dashboard,
    dataMap,
}: Props) {
    return (
        <div className="flex gap-3 items-center">
            {dashboard && (
                <ExportDropdown
                    dashboard={dashboard}
                    dataMap={dataMap}
                    canSchedule={canEdit}
                />
            )}

            {canShare && (
                <button
                    onClick={onOpenShare}
                    className="border-indigo-600/35 border text-indigo-600 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                >
                    Share Access
                </button>
            )}

            {canEdit && (
                <>
                    <button
                        onClick={onSave}
                        className="border border-border text-foreground rounded-xl px-4 py-2 text-xs font-medium hover:bg-muted cursor-pointer"
                    >
                        Save Dashboard
                    </button>

                    <button
                        onClick={onAddWidget}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                    >
                        Add Widget
                    </button>
                </>
            )}
        </div>
    )
}
