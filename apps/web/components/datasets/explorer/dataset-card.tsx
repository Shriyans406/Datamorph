import Link from "next/link"

interface Props {
    dataset: any
}

export function DatasetCard({
    dataset,
}: Props) {
    return (
        <Link
            href={`/datasets/${dataset.id}`}
            className="border rounded-2xl p-5 hover:bg-muted transition"
        >
            <div className="space-y-2">
                <h2 className="font-semibold text-lg">
                    {dataset.metadata.name}
                </h2>

                <div className="text-sm text-muted-foreground">
                    <p>
                        Rows:
                        {" "}
                        {dataset.metadata.rows}
                    </p>

                    <p>
                        Columns:
                        {" "}
                        {dataset.metadata.columns}
                    </p>
                </div>
            </div>
        </Link>
    )
}