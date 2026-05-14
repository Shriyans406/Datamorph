"use client"

import { useMemo } from "react"

import { executeQuery } from "../pipeline/execute-query"

import {
    DatasetQuery,
} from "../types/query.types"

export function useQueryEngine(
    rows: Record<string, any>[],
    query: DatasetQuery
) {
    return useMemo(() => {
        return executeQuery(
            rows,
            query
        )
    }, [rows, query])
}