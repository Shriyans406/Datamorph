import { ChartRenderer } from "@/components/visualizations/charts/chart-renderer"

interface Props {
    widget: any
    data: any[]
}

export function DashboardWidgetCard({
    widget,
    data,
}: Props) {
    // Support both the new 'visualization' shape and legacy 'config' shape
    const vizConfig = widget.visualization ?? widget.config

    if (!vizConfig) {
        return (
            <div className="border rounded-2xl bg-background p-4 h-full flex items-center justify-center text-sm text-muted-foreground">
                Widget has no configuration
            </div>
        )
    }

    return (
        <div className="border rounded-2xl bg-background p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                    {vizConfig.title}
                </h2>
            </div>

            <ChartRenderer
                data={data}
                config={vizConfig}
            />
        </div>
    )
}