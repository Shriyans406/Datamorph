"use client"

import {
    DatasetQuery,
} from "@/services/datasets/query-engine/types/query.types"

interface Props {
    columns: string[]
    query: DatasetQuery
    onChange: (query: DatasetQuery) => void
}

export function QueryBuilder({
    columns,
    query,
    onChange,
}: Props) {
    const filters = query.filters || []

    function addFilter() {
        onChange({
            ...query,
            filters: [
                ...filters,
                {
                    column: columns[0] || "",
                    operator: "equals" as const,
                    value: "",
                },
            ],
        })
    }

    function removeFilter(index: number) {
        const updated = filters.filter((_, i) => i !== index)
        onChange({ ...query, filters: updated })
    }

    function updateFilter(
        index: number,
        field: "column" | "operator" | "value",
        value: string
    ) {
        const updated = filters.map((f, i) =>
            i === index
                ? { ...f, [field]: value }
                : f
        )
        onChange({ ...query, filters: updated })
    }

    return (
        <div className="border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                    Query Builder
                </h2>

                <button
                    onClick={addFilter}
                    className="border rounded-lg px-3 py-1 text-sm"
                >
                    Add Filter
                </button>
            </div>

            {filters.length > 0 && (
                <div className="space-y-2">
                    {filters.map((filter, index) => (
                        <div
                            key={index}
                            className="flex gap-2 items-center"
                        >
                            <select
                                value={filter.column}
                                onChange={(e) =>
                                    updateFilter(index, "column", e.target.value)
                                }
                                className="border rounded-lg px-2 py-1 text-sm"
                            >
                                {columns.map((col) => (
                                    <option key={col} value={col}>
                                        {col}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filter.operator}
                                onChange={(e) =>
                                    updateFilter(index, "operator", e.target.value)
                                }
                                className="border rounded-lg px-2 py-1 text-sm"
                            >
                                <option value="equals">equals</option>
                                <option value="contains">contains</option>
                                <option value="greater_than">greater than</option>
                                <option value="less_than">less than</option>
                                <option value="not_equals">not equals</option>
                            </select>

                            <input
                                value={filter.value}
                                onChange={(e) =>
                                    updateFilter(index, "value", e.target.value)
                                }
                                placeholder="value..."
                                className="border rounded-lg px-2 py-1 text-sm flex-1"
                            />

                            <button
                                onClick={() => removeFilter(index)}
                                className="text-red-500 hover:text-red-700 px-2 text-sm font-bold"
                                title="Remove filter"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}