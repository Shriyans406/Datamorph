"use client"

import { useMemo, useState } from "react"

import { ExplorerSearch } from "./explorer-search"
import { ExplorerPagination } from "./explorer-pagination"
import { ExplorerEmpty } from "./explorer-empty"
import { useQueryEngine } from "@/services/datasets/query-engine/hooks/use-query-engine"
import { QueryBuilder } from "./query-builder"

interface Props {
    rows: Record<string, any>[]
}

const PAGE_SIZE = 10

/**
 * Auto-fix rows that were stored from a semicolon-delimited CSV parsed as
 * a single column.  PapaParse with comma delimiter on a semicolon file will
 * create one key that IS the entire header string, possibly with extra
 * "__EMPTY" or "__EMPTY_n" keys for overflow cells.
 */
function normalizeRows(rawRows: Record<string, any>[]): Record<string, any>[] {
    if (!rawRows || rawRows.length === 0) return rawRows

    const firstRow = rawRows[0]
    const keys = Object.keys(firstRow)

    // Find the key that looks like the full semicolon-joined header
    const headerKey = keys.find(
        (k) => k.includes(";") && k.split(";").length > 3
    )

    if (!headerKey) return rawRows // Data looks normal, nothing to fix

    // Strip surrounding quotes from each token
    const strip = (s: string) => s.replace(/^["'\s]+|["'\s]+$/g, "").trim()
    const headers = headerKey.split(";").map(strip).filter(Boolean)

    return rawRows.map((row) => {
        const raw = String(row[headerKey])
        const values = raw.split(";").map(strip)
        const obj: Record<string, any> = {}
        headers.forEach((header, i) => {
            obj[header] = values[i] ?? ""
        })
        return obj
    })
}


export function ExplorerTable({ rows }: Props) {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [query, setQuery] = useState<any>({ filters: [] })

    // Fix semicolon-delimited data stored as single column
    const normalizedRows = useMemo(() => normalizeRows(rows), [rows])

    const columns = normalizedRows.length ? Object.keys(normalizedRows[0]) : []

    const searchFilteredRows = useMemo(() => {
        if (!search) return normalizedRows
        const term = search.toLowerCase()
        return normalizedRows.filter((row) =>
            Object.values(row).join(" ").toLowerCase().includes(term)
        )
    }, [normalizedRows, search])

    const fullQuery = useMemo(() => {
        const q = { ...query }
        if (sortColumn) {
            q.sorting = [{ column: sortColumn, direction: sortDirection }]
        } else {
            q.sorting = undefined
        }
        return q
    }, [query, sortColumn, sortDirection])

    const queryResult = useQueryEngine(searchFilteredRows, fullQuery)
    const sortedRows = queryResult.rows

    const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE)

    const paginatedRows = sortedRows.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    )

    function handleSort(column: string) {
        if (sortColumn === column) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            return
        }
        setSortColumn(column)
        setSortDirection("asc")
    }

    return (
        <div className="space-y-4">
            <ExplorerSearch value={search} onChange={setSearch} />

            <QueryBuilder
                columns={columns}
                query={query}
                onChange={setQuery}
            />

            {!paginatedRows.length ? (
                <ExplorerEmpty />
            ) : (
                <>
                    {/* Scrollable table wrapper */}
                    <div className="overflow-x-auto overflow-y-auto border rounded-xl max-h-[520px]">
                        <table className="min-w-full text-sm border-collapse">
                            <thead className="bg-muted sticky top-0 z-10">
                                <tr>
                                    {/* Row number column */}
                                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-r w-10 select-none">
                                        #
                                    </th>

                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            onClick={() => handleSort(column)}
                                            className="text-left px-3 py-2 font-semibold cursor-pointer whitespace-nowrap border-b border-r last:border-r-0 select-none hover:bg-muted/80 transition-colors"
                                            style={{ minWidth: "120px", maxWidth: "240px" }}
                                        >
                                            <span className="flex items-center gap-1">
                                                <span
                                                    className="block truncate"
                                                    title={column}
                                                >
                                                    {column}
                                                </span>
                                                {sortColumn === column && (
                                                    <span className="text-xs text-primary shrink-0">
                                                        {sortDirection === "asc" ? "↑" : "↓"}
                                                    </span>
                                                )}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedRows.map((row, index) => {
                                    const globalIndex = (page - 1) * PAGE_SIZE + index + 1
                                    return (
                                        <tr
                                            key={index}
                                            className={
                                                index % 2 === 0
                                                    ? "bg-background"
                                                    : "bg-muted/30"
                                            }
                                        >
                                            {/* Row number */}
                                            <td className="px-3 py-2 text-muted-foreground text-xs border-b border-r font-mono">
                                                {globalIndex}
                                            </td>

                                            {columns.map((column) => {
                                                const val = row[column]
                                                const display =
                                                    val === null || val === undefined
                                                        ? ""
                                                        : String(val)
                                                return (
                                                    <td
                                                        key={column}
                                                        className="px-3 py-2 border-b border-r last:border-r-0 whitespace-nowrap"
                                                        style={{ maxWidth: "240px" }}
                                                        title={display}
                                                    >
                                                        <span className="block truncate">
                                                            {display || (
                                                                <span className="text-muted-foreground italic text-xs">
                                                                    —
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <ExplorerPagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    )
}