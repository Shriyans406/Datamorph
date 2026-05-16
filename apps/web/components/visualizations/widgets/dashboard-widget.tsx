import { ChartRenderer } from "../charts/chart-renderer"

interface Props {
    data: any[]

    widget: any
}

export function DashboardWidget({
    data,
    widget,
}: Props) {
    return (
        <div className="border rounded-2xl bg-background p-4 h-full">
            <div className="mb-4">
                <h2 className="font-semibold">
                    {
                        widget.visualization
                            .title
                    }
                </h2>
            </div>

            <ChartRenderer
                data={data}
                config={
                    widget.visualization
                }
            />
        </div>
    )
}