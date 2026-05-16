interface Props {
    name: string

    onNameChange: (
        value: string
    ) => void
}

export function DashboardSettings({
    name,
    onNameChange,
}: Props) {
    return (
        <div className="border rounded-2xl p-4">
            <h2 className="font-semibold mb-4">
                Dashboard Settings
            </h2>

            <input
                value={name}
                onChange={(e) =>
                    onNameChange(
                        e.target.value
                    )
                }
                className="border rounded-xl p-2 w-full"
            />
        </div>
    )
}