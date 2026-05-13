interface Props {
    page: number
    totalPages: number
    onPageChange: (
        page: number
    ) => void
}

export function ExplorerPagination({
    page,
    totalPages,
    onPageChange,
}: Props) {
    return (
        <div className="flex items-center gap-4">
            <button
                disabled={page === 1}
                onClick={() =>
                    onPageChange(page - 1)
                }
                className="border rounded-lg px-3 py-1"
            >
                Previous
            </button>

            <p>
                Page {page} of {totalPages}
            </p>

            <button
                disabled={
                    page === totalPages
                }
                onClick={() =>
                    onPageChange(page + 1)
                }
                className="border rounded-lg px-3 py-1"
            >
                Next
            </button>
        </div>
    )
}