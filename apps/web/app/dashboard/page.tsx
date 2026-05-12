import Link from "next/link"

import {
    getDatasets,
} from "@/repositories/datasets/dataset.repository"

export default async function DashboardPage() {
    const datasets =
        await getDatasets()

    return (
        <main className="p-10 space-y-8">
            <h1 className="text-3xl font-bold">
                Dashboard
            </h1>

            <div className="grid gap-4">
                {datasets.map((dataset: any) => (
                    <Link
                        key={dataset.id}
                        href={`/datasets/${dataset.id}`}
                        className="border rounded-xl p-4 hover:bg-muted"
                    >
                        <h2 className="font-semibold">
                            {dataset.metadata.name}
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            {dataset.metadata.rows} rows
                        </p>
                    </Link>
                ))}
            </div>
        </main>
    )
}