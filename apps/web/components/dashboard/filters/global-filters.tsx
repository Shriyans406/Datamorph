"use client"

interface Props {
    filters: any[]

    onChange: (
        filters: any[]
    ) => void
}

export function GlobalFilters({
    filters,
    onChange,
}: Props) {
    function addFilter() {
        onChange([
            ...filters,

            {
                id:
                    crypto.randomUUID(),

                column: "",

                operator:
                    "equals",

                value: "",
            },
        ])
    }

    return (
        <div className="border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                    Global Filters
                </h2>

                <button
                    onClick={addFilter}
                    className="border rounded-lg px-3 py-1"
                >
                    Add Filter
                </button>
            </div>

            {filters.map(
                (filter, index) => (
                    <div
                        key={filter.id}
                        className="grid grid-cols-3 gap-2"
                    >
                        <input
                            placeholder="Column"
                            value={
                                filter.column
                            }
                            onChange={(
                                e
                            ) => {
                                const updated =
                                    [...filters]

                                updated[
                                    index
                                ].column =
                                    e.target.value

                                onChange(
                                    updated
                                )
                            }}
                            className="border rounded-lg p-2"
                        />

                        <select
                            value={
                                filter.operator
                            }
                            onChange={(
                                e
                            ) => {
                                const updated =
                                    [...filters]

                                updated[
                                    index
                                ].operator =
                                    e.target.value

                                onChange(
                                    updated
                                )
                            }}
                            className="border rounded-lg p-2"
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
                        </select>

                        <input
                            placeholder="Value"
                            value={
                                filter.value
                            }
                            onChange={(
                                e
                            ) => {
                                const updated =
                                    [...filters]

                                updated[
                                    index
                                ].value =
                                    e.target.value

                                onChange(
                                    updated
                                )
                            }}
                            className="border rounded-lg p-2"
                        />
                    </div>
                )
            )}
        </div>
    )
}