"use client"

interface Props {
    onAdd: (
        name: string,
        expression: string
    ) => void
}

export function ComputedColumnBuilder({
    onAdd,
}: Props) {
    return (
        <button
            onClick={() => {
                const name =
                    prompt(
                        "Column name"
                    )

                const expression =
                    prompt(
                        "Expression (example: price * quantity)"
                    )

                if (
                    name &&
                    expression
                ) {
                    onAdd(
                        name,
                        expression
                    )
                }
            }}
            className="border rounded-xl px-4 py-2"
        >
            Add Computed Column
        </button>
    )
}