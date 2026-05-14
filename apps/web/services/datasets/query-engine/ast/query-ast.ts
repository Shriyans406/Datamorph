import { DatasetQuery } from "../types/query.types"

export interface QueryAST {
    type: "query"

    filters: DatasetQuery["filters"]

    sorting: DatasetQuery["sorting"]

    pagination: DatasetQuery["pagination"]

    aggregations:
    DatasetQuery["aggregations"]

    groupBy: DatasetQuery["groupBy"]

    computedColumns:
    DatasetQuery["computedColumns"]
}

export function buildQueryAST(
    query: DatasetQuery
): QueryAST {
    return {
        type: "query",

        filters: query.filters || [],

        sorting: query.sorting || [],

        pagination:
            query.pagination,

        aggregations:
            query.aggregations || [],

        groupBy:
            query.groupBy || [],

        computedColumns:
            query.computedColumns || [],
    }
}