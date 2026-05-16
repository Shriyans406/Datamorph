"use client"

import { useState, useEffect } from "react"
import { getDatasets, getDatasetById } from "@/repositories/datasets/dataset.repository"

interface Props {
    isOpen: boolean
    onClose: () => void
    onAdd: (widget: any) => void
}

export function AddWidgetModal({ isOpen, onClose, onAdd }: Props) {
    const [datasets, setDatasets] = useState<any[]>([])
    const [selectedDatasetId, setSelectedDatasetId] = useState("")
    const [columns, setColumns] = useState<string[]>([])
    
    const [title, setTitle] = useState("")
    const [type, setType] = useState("bar_chart")
    const [xAxis, setXAxis] = useState("")
    const [yAxis, setYAxis] = useState("")

    useEffect(() => {
        if (isOpen) {
            getDatasets().then(setDatasets)
        }
    }, [isOpen])

    useEffect(() => {
        if (!selectedDatasetId) return
        getDatasetById(selectedDatasetId).then((data) => {
            if (data && data.profile && data.profile.columns) {
                const cols = data.profile.columns.map((c: any) => c.column)
                setColumns(cols)
                if (cols.length > 0) {
                    setXAxis(cols[0])
                    setYAxis(cols[Math.min(1, cols.length - 1)])
                }
            } else if (data && data.schema) {
                const cols = Object.keys(data.schema)
                setColumns(cols)
                if (cols.length > 0) {
                    setXAxis(cols[0])
                    setYAxis(cols[Math.min(1, cols.length - 1)])
                }
            }
        })
    }, [selectedDatasetId])

    function handleAdd() {
        if (!selectedDatasetId) return

        onAdd({
            id: crypto.randomUUID(),
            type,
            title,
            datasetId: selectedDatasetId,
            layout: { x: 0, y: Infinity, w: 6, h: 8 },
            config: {
                type: type.replace("_chart", ""),
                title,
                xAxis,
                yAxis
            }
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-950 border rounded-2xl p-6 w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold">Add Widget</h2>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Widget Title</label>
                    <input 
                        className="w-full border rounded-xl p-2 bg-transparent"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sales over Time"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Dataset</label>
                    <select 
                        className="w-full border rounded-xl p-2 bg-transparent"
                        value={selectedDatasetId}
                        onChange={(e) => setSelectedDatasetId(e.target.value)}
                    >
                        <option value="">Select a dataset...</option>
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.metadata.name}</option>
                        ))}
                    </select>
                </div>

                {selectedDatasetId && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chart Type</label>
                            <select 
                                className="w-full border rounded-xl p-2 bg-transparent"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="bar_chart">Bar Chart</option>
                                <option value="line_chart">Line Chart</option>
                                <option value="pie_chart">Pie Chart</option>
                                <option value="area_chart">Area Chart</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">X-Axis</label>
                                <select 
                                    className="w-full border rounded-xl p-2 bg-transparent"
                                    value={xAxis}
                                    onChange={(e) => setXAxis(e.target.value)}
                                >
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Y-Axis</label>
                                <select 
                                    className="w-full border rounded-xl p-2 bg-transparent"
                                    value={yAxis}
                                    onChange={(e) => setYAxis(e.target.value)}
                                >
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="px-4 py-2 hover:bg-muted rounded-xl">Cancel</button>
                    <button 
                        onClick={handleAdd}
                        disabled={!selectedDatasetId || !title}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>
    )
}
