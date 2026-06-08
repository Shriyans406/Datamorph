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
        <div className="border border-slate-800 rounded-2xl bg-slate-900 p-4 h-full overflow-hidden flex flex-col" data-widget-id={widget.id}>
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="font-semibold text-sm text-slate-100 truncate">
                    {vizConfig.title}
                </h2>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md flex-shrink-0 ml-2">
                    {vizConfig.type ?? "chart"}
                </span>
            </div>

            <div className="flex-1 min-h-0">
                <ChartRenderer
                    data={data}
                    config={vizConfig}
                />
            </div>
        </div>
    )
}