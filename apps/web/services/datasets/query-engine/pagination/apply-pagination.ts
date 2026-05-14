import {
    QueryPagination,
} from "../types/query.types"

export function applyPagination(
    rows: Record<string, any>[],
    pagination?: QueryPagination
) {
    if (!pagination)
        return rows

    const start =
        (pagination.page - 1) *
        pagination.pageSize

    const end =
        start +
        pagination.pageSize

    return rows.slice(start, end)
}