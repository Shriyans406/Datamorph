"use client"

import { useState, useEffect } from "react"
import { getDatasets, getDatasetById } from "@/repositories/datasets/dataset.repository"

interface Props {
    isOpen: boolean
    onClose: () => void
    onAdd: (widget: any) => void
}

const CHART_TYPES = [
    { value: "bar", label: "Bar Chart" },
    { value: "line", label: "Line Chart" },
    { value: "area", label: "Area Chart" },
    { value: "pie", label: "Pie Chart" },
]

export function AddWidgetModal({ isOpen, onClose, onAdd }: Props) {
    const [datasets, setDatasets] = useState<any[]>([])
    const [selectedDatasetId, setSelectedDatasetId] = useState("")
    const [columns, setColumns] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const [title, setTitle] = useState("")
    const [chartType, setChartType] = useState("bar")
    const [xAxis, setXAxis] = useState("")
    const [yAxis, setYAxis] = useState("")

    // Reset state every time the modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedDatasetId("")
            setColumns([])
            setTitle("")
            setChartType("bar")
            setXAxis("")
            setYAxis("")
            getDatasets().then(setDatasets)
        }
    }, [isOpen])

    // When a dataset is selected, fetch its columns
    useEffect(() => {
        if (!selectedDatasetId) {
            setColumns([])
            setXAxis("")
            setYAxis("")
            return
        }

        setLoading(true)
        getDatasetById(selectedDatasetId).then((rawData) => {
            setLoading(false)
            const data = rawData as any
            if (!data) return

            let cols: string[] = []

            // Try profile.columns first (the main source of truth)
            if (data.profile?.columns?.length > 0) {
                cols = data.profile.columns.map((c: any) => c.column)
            } else if (data.rows?.length > 0) {
                // Fallback: derive columns from actual row data
                cols = Object.keys(data.rows[0])
            } else if (data.schema) {
                cols = Object.keys(data.schema)
            }

            setColumns(cols)
            if (cols.length >= 1) setXAxis(cols[0])
            if (cols.length >= 2) setYAxis(cols[1])
            else if (cols.length === 1) setYAxis(cols[0])
        })
    }, [selectedDatasetId])

    function handleAdd() {
        if (!selectedDatasetId || !title || !xAxis || !yAxis) return

        const widgetId = crypto.randomUUID()

        onAdd({
            id: widgetId,
            datasetId: selectedDatasetId,
            layout: { x: 0, y: Infinity, w: 6, h: 8 },
            // Use the visualization shape that ChartRenderer & DashboardWidget expect
            visualization: {
                id: widgetId,
                type: chartType,
                title,
                xAxis,
                yAxis,
            },
        })

        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-background border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
                <h2 className="text-xl font-bold">Add Widget</h2>

                {/* Title */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Widget Title</label>
                    <input
                        className="w-full border rounded-xl p-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sales over Time"
                    />
                </div>

                {/* Dataset selector */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Dataset</label>
                    <select
                        className="w-full border rounded-xl p-2"
                        value={selectedDatasetId}
                        onChange={(e) => setSelectedDatasetId(e.target.value)}
                    >
                        <option value="">Select a dataset...</option>
                        {datasets.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.metadata?.name ?? d.id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Chart type selector — always visible once dataset chosen */}
                {selectedDatasetId && (
                    <>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Chart Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {CHART_TYPES.map((ct) => (
                                    <button
                                        key={ct.value}
                                        onClick={() => setChartType(ct.value)}
                                        className={`border rounded-xl py-2 text-sm font-medium transition ${
                                            chartType === ct.value
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        {ct.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Axis selectors */}
                        {loading ? (
                            <p className="text-sm text-muted-foreground">
                                Loading columns...
                            </p>
                        ) : columns.length === 0 ? (
                            <p className="text-sm text-destructive">
                                Could not load columns for this dataset.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">X-Axis (Category)</label>
                                    <select
                                        className="w-full border rounded-xl p-2"
                                        value={xAxis}
                                        onChange={(e) => setXAxis(e.target.value)}
                                    >
                                        {columns.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Y-Axis (Value)</label>
                                    <select
                                        className="w-full border rounded-xl p-2"
                                        value={yAxis}
                                        onChange={(e) => setYAxis(e.target.value)}
                                    >
                                        {columns.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 hover:bg-muted rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedDatasetId || !title || !xAxis || !yAxis}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>
    )
}
