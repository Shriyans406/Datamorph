interface Props {
    onSave: () => void

    onAddWidget: () => void
}

export function DashboardToolbar({
    onSave,
    onAddWidget,
}: Props) {
    return (
        <div className="flex gap-3">
            <button
                onClick={onSave}
                className="border rounded-xl px-4 py-2"
            >
                Save Dashboard
            </button>

            <button
                onClick={onAddWidget}
                className="border rounded-xl px-4 py-2"
            >
                Add Widget
            </button>
        </div>
    )
}