interface Props {
    data: any[]

    config: any
}

export function KpiCard({
    data,
    config,
}: Props) {
    const total = data.reduce(
        (acc, row) =>
            acc +
            Number(
                row[config.metric]
            ),
        0
    )

    return (
        <div className="border rounded-2xl p-6">
            <p className="text-muted-foreground">
                {config.title}
            </p>

            <h2 className="text-4xl font-bold mt-2">
                {total}
            </h2>
        </div>
    )
}