"use client"

import { useEffect, useState } from "react"

import { useParams } from "next/navigation"

import { ExplorerTable } from "@/components/datasets/explorer/explorer-table"

import { ProfileSummary } from "@/components/datasets/profile-summary"
import { ColumnProfileCard } from "@/components/datasets/column-profile-card"
import { getDatasetById } from "@/repositories/datasets/dataset.repository"
import { AIInsightsPanel } from "@/components/datasets/ai-insights-panel"


import { NLQueryEngine } from "@/components/datasets/nl-query-engine"

export default function DatasetPage() {
    const params = useParams()
    const id = params.id as string

    const [dataset, setDataset] = useState<any>(null)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!id) return
        getDatasetById(id).then((data) => {
            if (!data) setNotFound(true)
            else setDataset(data)
        })
    }, [id])

    if (notFound) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <p className="text-slate-400 text-sm">Dataset not found</p>
            </main>
        )
    }

    if (!dataset) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <p className="text-slate-400 text-sm animate-pulse">Loading dataset...</p>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">
                    {dataset.metadata.name}
                </h1>

                <p className="text-muted-foreground">
                    {dataset.metadata.rows} rows · {dataset.metadata.columns} columns
                </p>

                <div className="mt-4">
                    <ProfileSummary
                        profile={dataset.profile}
                    />
                </div>
            </div>

            {/* AI Insights & Exploration Panel */}
            <div className="mt-6">
                <AIInsightsPanel dataset={dataset} />
            </div>

            {/* Natural Language Query Engine */}
            <div className="mt-8">
                <NLQueryEngine dataset={dataset} />
            </div>

            {/* Schema */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                    Schema
                </h2>

                <pre className="bg-muted text-sm p-4 rounded-xl overflow-auto max-h-48">
                    {JSON.stringify(
                        dataset.schema,
                        null,
                        2
                    )}
                </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button className="border border-slate-700 text-slate-300 rounded-xl px-4 py-2 hover:bg-slate-800 transition text-sm font-medium">
                    Export
                </button>

                <button onClick={() => window.location.reload()} className="border border-slate-700 text-slate-300 rounded-xl px-4 py-2 hover:bg-slate-800 transition text-sm font-medium">
                    Refresh
                </button>
            </div>

            {/* Preview Table with QueryBuilder */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                    Preview
                </h2>

                <ExplorerTable
                    rows={dataset.rows}
                />
            </div>

            {/* Column Profiles */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                    Column Profiles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                        const rawColumns: any[] = dataset.profile.columns ?? []
                        // Check if columns were stored with semicolon-joined header key
                        const brokenCol = rawColumns.find(
                            (c: any) =>
                                c.column &&
                                c.column.includes(";") &&
                                c.column.split(";").length > 3
                        )
                        // If broken: expand into one card per real column name
                        const displayColumns = brokenCol
                            ? brokenCol.column
                                .split(";")
                                .map((name: string) =>
                                    name.replace(/^["'\s]+|["'\s]+$/g, "").trim()
                                )
                                .filter(Boolean)
                                .map((name: string) => ({
                                    column: name,
                                    type: "unknown",
                                    completeness: 0,
                                    uniqueCount: 0,
                                    duplicateCount: 0,
                                    nullCount: 0,
                                }))
                            : rawColumns

                        return displayColumns.map((column: any) => (
                            <ColumnProfileCard
                                key={column.column}
                                column={column}
                            />
                        ))
                    })()}
                </div>
            </div>
        </main>
    )
}