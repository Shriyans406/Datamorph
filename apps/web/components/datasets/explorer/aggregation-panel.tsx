interface Props {
    aggregations: Record<
        string,
        any
    > | null
}

export function AggregationPanel({
    aggregations,
}: Props) {
    if (!aggregations) {
        return null
    }

    return (
        <div className="border rounded-xl p-4 space-y-2">
            <h2 className="font-semibold">
                Aggregations
            </h2>

            {Object.entries(
                aggregations
            ).map(([key, value]) => (
                <div
                    key={key}
                    className="flex justify-between"
                >
                    <span>{key}</span>

                    <span>
                        {String(value)}
                    </span>
                </div>
            ))}
        </div>
    )
}