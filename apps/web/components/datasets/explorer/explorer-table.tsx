"use client"

import { useMemo, useState } from "react"

import { ExplorerSearch } from "./explorer-search"

import { ExplorerPagination } from "./explorer-pagination"

import { ExplorerEmpty } from "./explorer-empty"


//new imports
import { useQueryEngine } from "@/services/datasets/query-engine/hooks/use-query-engine"

import { QueryBuilder } from "./query-builder"


interface Props {
    rows: Record<string, any>[]
}

const PAGE_SIZE = 10

export function ExplorerTable({
    rows,
}: Props) {
    const [search, setSearch] =
        useState("")

    const [page, setPage] =
        useState(1)

    const [sortColumn, setSortColumn] =
        useState<string | null>(null)

    const [sortDirection, setSortDirection] =
        useState<
            "asc" | "desc"
        >("asc")

    const [query, setQuery] =
        useState<any>({
            filters: [],
        })

    const columns = rows.length
        ? Object.keys(rows[0])
        : []

    const searchFilteredRows = useMemo(() => {
        if (!search) return rows
        return rows.filter((row) =>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )
        )
    }, [rows, search])

    const fullQuery = useMemo(() => {
        const q = { ...query }
        if (sortColumn) {
            q.sorting = [{ column: sortColumn, direction: sortDirection }]
        } else {
            q.sorting = undefined
        }
        return q
    }, [query, sortColumn, sortDirection])

    const queryResult =
        useQueryEngine(searchFilteredRows, fullQuery)

    const sortedRows =
        queryResult.rows

    const totalPages = Math.ceil(
        sortedRows.length / PAGE_SIZE
    )

    const paginatedRows =
        sortedRows.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE
        )

    function handleSort(
        column: string
    ) {
        if (sortColumn === column) {
            setSortDirection((prev) =>
                prev === "asc"
                    ? "desc"
                    : "asc"
            )

            return
        }

        setSortColumn(column)

        setSortDirection("asc")
    }

    return (
        <div className="space-y-4">
            <ExplorerSearch
                value={search}
                onChange={setSearch}
            />

            <QueryBuilder
                columns={columns}
                query={query}
                onChange={setQuery}
            />

            {!paginatedRows.length ? (
                <ExplorerEmpty />
            ) : (
                <>
                    <div className="overflow-auto border rounded-xl max-h-[600px]">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    {columns.map(
                                        (column) => (
                                            <th
                                                key={column}
                                                onClick={() =>
                                                    handleSort(
                                                        column
                                                    )
                                                }
                                                className="text-left p-3 cursor-pointer whitespace-nowrap"
                                            >
                                                {column}

                                                {sortColumn ===
                                                    column &&
                                                    (
                                                        sortDirection ===
                                                            "asc"
                                                            ? " ↑"
                                                            : " ↓"
                                                    )}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedRows.map(
                                    (row, index) => (
                                        <tr
                                            key={index}
                                            className="border-t"
                                        >
                                            {columns.map(
                                                (column) => (
                                                    <td
                                                        key={
                                                            column
                                                        }
                                                        className="p-3 whitespace-nowrap"
                                                    >
                                                        {String(
                                                            row[
                                                            column
                                                            ]
                                                        )}
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ExplorerPagination
                        page={page}
                        totalPages={
                            totalPages
                        }
                        onPageChange={
                            setPage
                        }
                    />
                </>
            )}
        </div>
    )
}