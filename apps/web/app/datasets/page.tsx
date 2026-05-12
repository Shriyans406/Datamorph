"use client"

import { useState } from "react"

import { UploadZone } from "@/components/datasets/upload-zone"

import { processDataset } from "@/services/datasets/dataset.service"

export default function DatasetsPage() {
    const [dataset, setDataset] = useState<any>(null)

    async function handleFile(file: File) {
        const processed = await processDataset(file)

        console.log(processed)

        setDataset(processed)
    }

    return (
        <main className="p-10 space-y-8">
            <h1 className="text-3xl font-bold">
                Datasets
            </h1>

            <UploadZone onFileAccepted={handleFile} />

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

                    <pre className="bg-black text-white p-4 rounded-xl overflow-auto">
                        {JSON.stringify(
                            dataset.schema,
                            null,
                            2
                        )}
                    </pre>
                </div>
            )}
        </main>
    )
}