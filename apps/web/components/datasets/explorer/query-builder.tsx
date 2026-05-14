"use client"

import {
    DatasetQuery,
} from "@/services/datasets/query-engine/types/query.types"

interface Props {
    columns: string[]

    query: DatasetQuery

    onChange: (
        query: DatasetQuery
    ) => void
}

export function QueryBuilder({
    columns,
    query,
    onChange,
}: Props) {
    function addFilter() {
        onChange({
            ...query,

            filters: [
                ...(query.filters || []),

                {
                    column: columns[0],

                    operator: "equals",

                    value: "",
                },
            ],
        })
    }

    return (
        <div className="border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                    Query Builder
                </h2>

                <button
                    onClick={addFilter}
                    className="border rounded-lg px-3 py-1"
                >
                    Add Filter
                </button>
            </div>

            <div className="space-y-3">
                {query.filters?.map(
                    (filter, index) => (
                        <div
                            key={index}
                            className="flex gap-2"
                        >
                            <select
                                value={
                                    filter.column
                                }
                                onChange={(
                                    e
                                ) => {
                                    const updated =
                                        [
                                            ...(query.filters ||
                                                []),
                                        ]

                                    updated[
                                        index
                                    ].column =
                                        e.target.value

                                    onChange({
                                        ...query,

                                        filters:
                                            updated,
                                    })
                                }}
                                className="border rounded-lg px-2 py-1"
                            >
                                {columns.map(
                                    (column) => (
                                        <option
                                            key={
                                                column
                                            }
                                            value={
                                                column
                                            }
                                        >
                                            {column}
                                        </option>
                                    )
                                )}
                            </select>

                            <select
                                value={
                                    filter.operator
                                }
                                onChange={(
                                    e
                                ) => {
                                    const updated =
                                        [
                                            ...(query.filters ||
                                                []),
                                        ]

                                    updated[
                                        index
                                    ].operator =
                                        e.target
                                            .value as any

                                    onChange({
                                        ...query,

                                        filters:
                                            updated,
                                    })
                                }}
                                className="border rounded-lg px-2 py-1"
                            >
                                <option value="equals">
                                    equals
                                </option>

                                <option value="contains">
                                    contains
                                </option>

                                <option value="greater_than">
                                    greater_than
                                </option>

                                <option value="less_than">
                                    less_than
                                </option>
                            </select>

                            <input
                                value={
                                    filter.value
                                }
                                onChange={(
                                    e
                                ) => {
                                    const updated =
                                        [
                                            ...(query.filters ||
                                                []),
                                        ]

                                    updated[
                                        index
                                    ].value =
                                        e.target.value

                                    onChange({
                                        ...query,

                                        filters:
                                            updated,
                                    })
                                }}
                                className="border rounded-lg px-2 py-1"
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    )
}