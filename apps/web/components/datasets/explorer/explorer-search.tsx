interface Props {
    value: string
    onChange: (
        value: string
    ) => void
}

export function ExplorerSearch({
    value,
    onChange,
}: Props) {
    return (
        <input
            value={value}
            onChange={(e) =>
                onChange(e.target.value)
            }
            placeholder="Search dataset..."
            className="border rounded-xl px-4 py-2 w-full"
        />
    )
}