import { VisualizationConfig } from "../types/visualization.types"

import { BarChartComponent } from "./bar-chart"

import { LineChartComponent } from "./line-chart"

import { PieChartComponent } from "./pie-chart"

import { AreaChartComponent } from "./area-chart"

import { KpiCard } from "./kpi-card"

interface Props {
    data: any[]

    config: VisualizationConfig
}

export function ChartRenderer({
    data,
    config,
}: Props) {
    switch (config.type) {
        case "bar":
            return (
                <BarChartComponent
                    data={data}
                    config={config}
                />
            )

        case "line":
            return (
                <LineChartComponent
                    data={data}
                    config={config}
                />
            )

        case "pie":
            return (
                <PieChartComponent
                    data={data}
                    config={config}
                />
            )

        case "area":
            return (
                <AreaChartComponent
                    data={data}
                    config={config}
                />
            )

        case "kpi":
            return (
                <KpiCard
                    data={data}
                    config={config}
                />
            )

        default:
            return null
    }
}