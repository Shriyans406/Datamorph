export function ExplorerEmpty() {
    return (
        <div className="border rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold">
                No rows found
            </h2>

            <p className="text-muted-foreground mt-2">
                Try changing search query
            </p>
        </div>
    )
}