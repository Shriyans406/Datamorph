"use client"

import { useState } from "react"

import { toast } from "sonner"

import { UploadZone } from "@/components/datasets/upload-zone"

import { processDataset } from "@/services/datasets/dataset.service"

import { persistDataset } from "@/services/datasets/persist-dataset"

export default function DatasetsPage() {
    const [loading, setLoading] =
        useState(false)

    const [dataset, setDataset] =
        useState<any>(null)

    async function handleFile(file: File) {
        try {
            setLoading(true)

            toast.loading("Processing dataset...")

            const processed =
                await processDataset(file)

            const datasetId =
                await persistDataset(processed)

            toast.dismiss()

            toast.success(
                "Dataset uploaded successfully"
            )

            setDataset({
                ...processed,
                id: datasetId,
            })
        } catch (error) {
            console.error(error)

            toast.dismiss()

            toast.error(
                "Failed to process dataset"
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="p-10 space-y-8">
            <h1 className="text-3xl font-bold">
                Datasets
            </h1>

            <UploadZone
                onFileAccepted={handleFile}
            />

            {loading && (
                <p className="text-sm text-muted-foreground">
                    Processing dataset...
                </p>
            )}

            {dataset && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        {dataset.metadata.name}
                    </h2>

                    <p>
                        Rows: {dataset.metadata.rows}
                    </p>

                    <p>
                        Columns: {dataset.metadata.columns}
                    </p>
                </div>
            )}
        </main>
    )
}