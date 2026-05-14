import {
    QueryFilter,
} from "../types/query.types"

export function applyFilters(
    rows: Record<string, any>[],
    filters: QueryFilter[]
) {
    return rows.filter((row) => {
        return filters.every((filter) => {
            const value =
                row[filter.column]

            switch (
            filter.operator
            ) {
                case "equals":
                    return (
                        value === filter.value
                    )

                case "not_equals":
                    return (
                        value !== filter.value
                    )

                case "contains":
                    return String(value)
                        .toLowerCase()
                        .includes(
                            String(
                                filter.value
                            ).toLowerCase()
                        )

                case "greater_than":
                    return (
                        Number(value) >
                        Number(filter.value)
                    )

                case "less_than":
                    return (
                        Number(value) <
                        Number(filter.value)
                    )

                default:
                    return true
            }
        })
    })
}