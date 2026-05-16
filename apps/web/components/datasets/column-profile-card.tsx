interface Props {
    column: any
}

export function ColumnProfileCard({ column }: Props) {
    // The column name can be very long if data was parsed incorrectly — truncate safely
    const columnName: string = column.column ?? "Unknown"
    const columnType: string = column.type ?? "unknown"

    const completeness = column.completeness ?? 0
    const uniqueCount = column.uniqueCount ?? 0
    const duplicateCount = column.duplicateCount ?? 0
    const nullCount = column.nullCount ?? 0

    const hasNumeric =
        column.numeric &&
        column.numeric.mean !== undefined &&
        !isNaN(column.numeric.mean)

    return (
        <div className="border rounded-xl p-4 space-y-3 overflow-hidden">
            {/* Column name + type badge */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h2
                        className="font-semibold text-sm truncate"
                        title={columnName}
                    >
                        {columnName}
                    </h2>
                </div>
                <span className="shrink-0 text-xs border rounded-full px-2 py-0.5 text-muted-foreground capitalize">
                    {columnType}
                </span>
            </div>

            {/* Completeness bar */}
            <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Completeness</span>
                    <span>{Math.round(completeness)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(completeness, 100)}%` }}
                    />
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Unique</p>
                    <p className="font-semibold mt-0.5">{uniqueCount}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Dupes</p>
                    <p className="font-semibold mt-0.5">{duplicateCount}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Nulls</p>
                    <p className="font-semibold mt-0.5">{nullCount}</p>
                </div>
            </div>

            {/* Numeric stats — only for numeric columns with valid values */}
            {hasNumeric && (
                <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3">
                    <div className="text-center">
                        <p className="text-muted-foreground">Min</p>
                        <p className="font-semibold mt-0.5">
                            {column.numeric.min}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Mean</p>
                        <p className="font-semibold mt-0.5">
                            {column.numeric.mean.toFixed(2)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Max</p>
                        <p className="font-semibold mt-0.5">
                            {column.numeric.max}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}