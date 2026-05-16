import { ChartRenderer } from "@/components/visualizations/charts/chart-renderer"

interface Props {
    widget: any

    data: any[]
}

export function DashboardWidgetCard({
    widget,
    data,
}: Props) {
    return (
        <div className="border rounded-2xl bg-background p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                    {widget.title}
                </h2>
            </div>

            <ChartRenderer
                data={data}
                config={
                    widget.config
                }
            />
        </div>
    )
}