"use client"

import { useState, useEffect } from "react"
import { DashboardToolbar } from "@/components/dashboard/toolbar/dashboard-toolbar"
import { DashboardGrid } from "@/components/dashboard/layouts/dashboard-grid"
import { GlobalFilters } from "@/components/dashboard/filters/global-filters"
import { saveDashboard } from "@/services/dashboard/persistence/dashboard.persistence"
import { executeQuery } from "@/services/datasets/query-engine/pipeline/execute-query"
import { getDatasetById } from "@/repositories/datasets/dataset.repository"
import { AddWidgetModal } from "@/components/dashboard/widgets/add-widget-modal"
import { DashboardFilter } from "@/services/dashboard/types/dashboard.types"

export default function DashboardBuilderPage() {
    const [widgets, setWidgets] = useState<any[]>([])
    const [filters, setFilters] = useState<DashboardFilter[]>([])
    const [name, setName] = useState("New Dashboard")

    // rawDataMap: datasetId -> original rows (fetched once)
    const [rawDataMap, setRawDataMap] = useState<Record<string, any[]>>({})

    // processedDataMap: datasetId -> rows after global filters applied
    const [processedDataMap, setProcessedDataMap] = useState<Record<string, any[]>>({})

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Fetch data for any newly-added datasets
    useEffect(() => {
        const uniqueIds = Array.from(new Set(widgets.map((w) => w.datasetId)))

        const missingIds = uniqueIds.filter((id) => !rawDataMap[id])
        if (missingIds.length === 0) return

        Promise.all(
            missingIds.map((id) =>
                getDatasetById(id).then((dataset) => ({
                    id,
                    rows: dataset?.rows ?? [],
                }))
            )
        ).then((results) => {
            setRawDataMap((prev) => {
                const updated = { ...prev }
                results.forEach(({ id, rows }) => {
                    updated[id] = rows
                })
                return updated
            })
        })
    }, [widgets])

    // Apply global filters whenever filters or rawDataMap changes
    useEffect(() => {
        const processed: Record<string, any[]> = {}
        for (const [datasetId, rows] of Object.entries(rawDataMap)) {
            processed[datasetId] =
                filters.length > 0
                    ? executeQuery(rows, { filters }).rows
                    : rows
        }
        setProcessedDataMap(processed)
    }, [filters, rawDataMap])

    async function handleSave() {
        await saveDashboard({
            id: `dashboard_${Date.now()}`,
            name,
            widgets,
            filters,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        } as any)
        alert("Dashboard saved!")
    }

    function handleAddWidget(widget: any) {
        setWidgets((prev) => [...prev, widget])
    }

    return (
        <main className="p-8 space-y-6">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-border"
                        placeholder="Dashboard Name"
                    />
                    <p className="text-muted-foreground text-sm">
                        Build your custom analytics dashboard using real datasets
                    </p>
                </div>

                <DashboardToolbar
                    onSave={handleSave}
                    onAddWidget={() => setIsAddModalOpen(true)}
                    canEdit={true}
                    canShare={false}
                    onOpenShare={() => {}}
                />
            </div>

            <GlobalFilters
                filters={filters}
                onChange={setFilters}
            />

            {widgets.length === 0 ? (
                <div className="border-2 border-dashed rounded-2xl p-20 text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No widgets yet</p>
                    <p className="text-sm">Click &quot;Add Widget&quot; above to add your first chart</p>
                </div>
            ) : (
                <DashboardGrid
                    widgets={widgets}
                    dataMap={processedDataMap}
                    isEditable={true}
                />
            )}

            <AddWidgetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddWidget}
            />
        </main>
    )
}