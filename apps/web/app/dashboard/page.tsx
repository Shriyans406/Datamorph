import {
    getDatasets,
} from "@/repositories/datasets/dataset.repository"

import { DatasetCard } from "@/components/datasets/explorer/dataset-card"

export default async function DashboardPage() {
    const datasets =
        await getDatasets()

    return (
        <main className="p-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Dashboard
                    </h1>

                    <p className="text-muted-foreground">
                        Explore uploaded datasets
                    </p>
                </div>
            </div>

            {!datasets.length ? (
                <div className="border rounded-xl p-10 text-center">
                    No datasets uploaded yet
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {datasets.map(
                        (dataset: any) => (
                            <DatasetCard
                                key={
                                    dataset.id
                                }
                                dataset={
                                    dataset
                                }
                            />
                        )
                    )}
                </div>
            )}
        </main>
    )
}