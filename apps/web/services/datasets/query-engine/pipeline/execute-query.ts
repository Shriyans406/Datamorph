import { buildQueryAST } from "../ast/query-ast"

import { DatasetQuery } from "../types/query.types"

import { applyFilters } from "../filters/apply-filters"

import { applySorting } from "../sorting/apply-sorting"

import { applyPagination } from "../pagination/apply-pagination"

import { applyAggregations } from "../aggregations/apply-aggregations"

import { applyGrouping } from "../grouping/apply-grouping"

import { applyComputedColumns } from "../transformations/apply-computed-columns"

export function executeQuery(
    rows: Record<string, any>[],
    query: DatasetQuery
) {
    const ast =
        buildQueryAST(query)

    let resultRows = [...rows]

    if (!rows.length) {
        return {
            rows: [],
            totalRows: 0,
            grouped: null,
            aggregations: null,
        }
    }

    if (
        ast.computedColumns?.length
    ) {
        resultRows =
            applyComputedColumns(
                resultRows,
                ast.computedColumns
            )
    }

    if (ast.filters?.length) {
        resultRows =
            applyFilters(
                resultRows,
                ast.filters
            )
    }

    if (ast.sorting?.length) {
        resultRows =
            applySorting(
                resultRows,
                ast.sorting
            )
    }

    const grouped =
        ast.groupBy?.length
            ? applyGrouping(
                resultRows,
                ast.groupBy
            )
            : null

    const aggregations =
        ast.aggregations?.length
            ? applyAggregations(
                resultRows,
                ast.aggregations
            )
            : null

    const paginated =
        applyPagination(
            resultRows,
            ast.pagination
        )

    return {
        rows: paginated,

        totalRows:
            resultRows.length,

        grouped,

        aggregations,
    }
}