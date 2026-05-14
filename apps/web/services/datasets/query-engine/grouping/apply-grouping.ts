import {
    QueryGroupBy,
} from "../types/query.types"

export function applyGrouping(
    rows: Record<string, any>[],
    groups: QueryGroupBy[]
) {
    if (!groups.length)
        return rows

    const grouped: Record<
        string,
        any[]
    > = {}

    rows.forEach((row) => {
        const key = groups
            .map(
                (group) =>
                    row[group.column]
            )
            .join("_")

        if (!grouped[key]) {
            grouped[key] = []
        }

        grouped[key].push(row)
    })

    return grouped
}