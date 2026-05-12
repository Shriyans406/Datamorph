"use client"

import { useEffect, useState } from "react"

import { useParams } from "next/navigation"

import { DatasetTable } from "@/components/datasets/dataset-table"
import { ProfileSummary } from "@/components/datasets/profile-summary"
import { ColumnProfileCard } from "@/components/datasets/column-profile-card"
import { getDatasetById } from "@/repositories/datasets/dataset.repository"

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
            <main className="p-10">
                Dataset not found
            </main>
        )
    }

    if (!dataset) {
        return (
            <main className="p-10">
                Loading...
            </main>
        )
    }

    return (
        <main className="p-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">
                    {dataset.metadata.name}
                </h1>

                <p className="text-muted-foreground">
                    {dataset.metadata.rows} rows
                </p>

                <ProfileSummary
                    profile={dataset.profile}
                />
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                    Schema
                </h2>

                <pre className="bg-black text-white p-4 rounded-xl overflow-auto">
                    {JSON.stringify(
                        dataset.schema,
                        null,
                        2
                    )}
                </pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                    Preview
                </h2>

                <DatasetTable
                    rows={dataset.rows.slice(0, 20)}
                />
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                    Column Profiles
                </h2>

                <div className="grid grid-cols-3 gap-4">
                    {dataset.profile.columns.map(
                        (column: any) => (
                            <ColumnProfileCard
                                key={column.column}
                                column={column}
                            />
                        )
                    )}
                </div>
            </div>
        </main>
    )
}