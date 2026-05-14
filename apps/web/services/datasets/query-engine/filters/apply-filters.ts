import {
    QueryFilter,
} from "../types/query.types"

export function applyFilters(
    rows: Record<string, any>[],
    filters: QueryFilter[]
) {
    return rows.filter((row) => {
        return filters.every((filter) => {
            if (filter.value === "" || filter.value === undefined) {
                return true
            }

            const value =
                row[filter.column]

            switch (
            filter.operator
            ) {
                case "equals":
                    // Coerce both sides so "30" matches 30
                    return (
                        String(value).toLowerCase() ===
                        String(filter.value).toLowerCase()
                    )

                case "not_equals":
                    return (
                        String(value).toLowerCase() !==
                        String(filter.value).toLowerCase()
                    )

                case "contains":
                    return String(value)
                        .toLowerCase()
                        .includes(
                            String(
                                filter.value
                            ).toLowerCase()
                        )

                case "greater_than": {
                    const numVal = Number(value)
                    const numFilter = Number(filter.value)
                    if (isNaN(numVal) || isNaN(numFilter)) return false
                    return numVal > numFilter
                }

                case "less_than": {
                    const numVal = Number(value)
                    const numFilter = Number(filter.value)
                    if (isNaN(numVal) || isNaN(numFilter)) return false
                    return numVal < numFilter
                }

                default:
                    return true
            }
        })
    })
}