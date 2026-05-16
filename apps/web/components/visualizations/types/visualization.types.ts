export type ChartType =
    | "bar"
    | "line"
    | "pie"
    | "area"
    | "kpi"

export interface VisualizationConfig {
    id: string

    type: ChartType

    title: string

    xAxis?: string

    yAxis?: string

    metric?: string

    color?: string
}

export interface DashboardWidget {
    id: string

    layout: {
        x: number
        y: number
        w: number
        h: number
    }

    visualization:
    VisualizationConfig
}