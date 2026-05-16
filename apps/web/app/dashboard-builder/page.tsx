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
    
    // dataMap stores the raw data fetched from each dataset
    const [rawDataMap, setRawDataMap] = useState<Record<string, any[]>>({})
    
    // processedDataMap stores the data after applying global filters
    const [processedDataMap, setProcessedDataMap] = useState<Record<string, any[]>>({})
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // When widgets change, fetch any missing datasets
    useEffect(() => {
        const fetchMissingDatasets = async () => {
            const uniqueDatasetIds = Array.from(new Set(widgets.map(w => w.datasetId)))
            
            const newDataMap = { ...rawDataMap }
            let updated = false
            
            for (const id of uniqueDatasetIds) {
                if (!newDataMap[id]) {
                    const dataset = await getDatasetById(id)
                    if (dataset && dataset.rows) {
                        newDataMap[id] = dataset.rows
                        updated = true
                    }
                }
            }
            
            if (updated) {
                setRawDataMap(newDataMap)
            }
        }
        
        fetchMissingDatasets()
    }, [widgets])

    // Apply filters whenever filters or rawDataMap changes
    useEffect(() => {
        const newProcessedDataMap: Record<string, any[]> = {}
        
        for (const [datasetId, rows] of Object.entries(rawDataMap)) {
            // Apply global filters to this dataset
            // Note: If a filter references a column that doesn't exist in this dataset,
            // executeQuery might filter out everything. It's up to the user to manage this.
            newProcessedDataMap[datasetId] = executeQuery(rows, { filters }).rows
        }
        
        setProcessedDataMap(newProcessedDataMap)
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
        alert("Dashboard Saved")
    }

    function handleAddWidget(widget: any) {
        setWidgets(prev => [...prev, widget])
    }

    return (
        <main className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-border"
                        placeholder="Dashboard Name"
                    />
                    <p className="text-muted-foreground">
                        Build your custom analytics dashboard
                    </p>
                </div>
                
                <DashboardToolbar
                    onSave={handleSave}
                    onAddWidget={() => setIsAddModalOpen(true)}
                />
            </div>

            <GlobalFilters
                filters={filters}
                onChange={setFilters}
            />

            <DashboardGrid
                widgets={widgets}
                dataMap={processedDataMap}
            />

            <AddWidgetModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddWidget}
            />
        </main>
    )
}