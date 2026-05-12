interface Props {
    profile: any
}

export function ProfileSummary({
    profile,
}: Props) {
    return (
        <div className="grid grid-cols-4 gap-4">
            <div className="border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                    Rows
                </p>

                <h2 className="text-2xl font-bold">
                    {profile.totalRows}
                </h2>
            </div>

            <div className="border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                    Columns
                </p>

                <h2 className="text-2xl font-bold">
                    {profile.totalColumns}
                </h2>
            </div>

            <div className="border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                    Duplicate Rows
                </p>

                <h2 className="text-2xl font-bold">
                    {profile.duplicateRows}
                </h2>
            </div>

            <div className="border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                    Health Score
                </p>

                <h2 className="text-2xl font-bold">
                    {Math.round(
                        profile.healthScore
                    )}
                    %
                </h2>
            </div>
        </div>
    )
}