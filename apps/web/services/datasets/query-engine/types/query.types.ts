export type FilterOperator =
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"

export interface QueryFilter {
    column: string
    operator: FilterOperator
    value: any
}

export interface QuerySort {
    column: string
    direction: "asc" | "desc"
}

export interface QueryPagination {
    page: number
    pageSize: number
}

export interface QueryAggregation {
    column: string
    operation:
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "count"
}

export interface QueryGroupBy {
    column: string
}

export interface ComputedColumn {
    name: string
    expression: string
}

export interface DatasetQuery {
    filters?: QueryFilter[]
    sorting?: QuerySort[]
    pagination?: QueryPagination
    aggregations?: QueryAggregation[]
    groupBy?: QueryGroupBy[]
    computedColumns?: ComputedColumn[]
}