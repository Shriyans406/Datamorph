interface Props {
    onAddChart: (
        type: string
    ) => void
}

export function VisualizationToolbar({
    onAddChart,
}: Props) {
    return (
        <div className="flex gap-2">
            <button
                onClick={() =>
                    onAddChart("bar")
                }
                className="border rounded-xl px-4 py-2"
            >
                Add Bar Chart
            </button>

            <button
                onClick={() =>
                    onAddChart("line")
                }
                className="border rounded-xl px-4 py-2"
            >
                Add Line Chart
            </button>

            <button
                onClick={() =>
                    onAddChart("pie")
                }
                className="border rounded-xl px-4 py-2"
            >
                Add Pie Chart
            </button>
        </div>
    )
}