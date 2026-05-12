import { DatasetTable } from "@/components/datasets/dataset-table"

import {
    getDatasetById,
} from "@/repositories/datasets/dataset.repository"

export default async function DatasetPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const dataset: any =
        await getDatasetById(id)

    if (!dataset) {
        return (
            <main className="p-10">
                Dataset not found
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
        </main>
    )
}