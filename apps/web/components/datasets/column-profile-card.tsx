interface Props {
    column: any
}

export function ColumnProfileCard({
    column,
}: Props) {
    return (
        <div className="border rounded-xl p-4 space-y-3">
            <div>
                <h2 className="font-semibold">
                    {column.column}
                </h2>

                <p className="text-sm text-muted-foreground">
                    {column.type}
                </p>
            </div>

            <div className="text-sm space-y-1">
                <p>
                    Completeness:
                    {" "}
                    {Math.round(
                        column.completeness
                    )}
                    %
                </p>

                <p>
                    Unique:
                    {" "}
                    {column.uniqueCount}
                </p>

                <p>
                    Duplicates:
                    {" "}
                    {column.duplicateCount}
                </p>

                <p>
                    Nulls:
                    {" "}
                    {column.nullCount}
                </p>
            </div>

            {column.numeric && (
                <div className="text-sm">
                    <p>
                        Mean:
                        {" "}
                        {column.numeric.mean.toFixed(
                            2
                        )}
                    </p>

                    <p>
                        Min:
                        {" "}
                        {column.numeric.min}
                    </p>

                    <p>
                        Max:
                        {" "}
                        {column.numeric.max}
                    </p>
                </div>
            )}
        </div>
    )
}