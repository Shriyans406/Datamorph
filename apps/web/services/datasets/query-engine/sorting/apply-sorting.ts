import {
    QuerySort,
} from "../types/query.types"

export function applySorting(
    rows: Record<string, any>[],
    sorting: QuerySort[]
) {
    if (!sorting.length)
        return rows

    return [...rows].sort(
        (a, b) => {
            for (const sort of sorting) {
                const aValue =
                    a[sort.column]

                const bValue =
                    b[sort.column]

                if (aValue < bValue) {
                    return sort.direction ===
                        "asc"
                        ? -1
                        : 1
                }

                if (aValue > bValue) {
                    return sort.direction ===
                        "asc"
                        ? 1
                        : -1
                }
            }

            return 0
        }
    )
}