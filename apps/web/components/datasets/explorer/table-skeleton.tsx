export function TableSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({
                length: 10,
            }).map((_, index) => (
                <div
                    key={index}
                    className="h-10 rounded-xl bg-muted animate-pulse"
                />
            ))}
        </div>
    )
}