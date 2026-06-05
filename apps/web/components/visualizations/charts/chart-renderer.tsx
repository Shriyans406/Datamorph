// import { VisualizationConfig } from "../types/visualization.types"

// import { BarChartComponent } from "./bar-chart"

// import { LineChartComponent } from "./line-chart"

// import { PieChartComponent } from "./pie-chart"

// import { AreaChartComponent } from "./area-chart"

// import { KpiCard } from "./kpi-card"

// interface Props {
//     data: any[]

//     config: VisualizationConfig
// }

// export function ChartRenderer({
//     data,
//     config,
// }: Props) {
//     switch (config.type) {
//         case "bar":
//             return (
//                 <BarChartComponent
//                     data={data}
//                     config={config}
//                 />
//             )

//         case "line":
//             return (
//                 <LineChartComponent
//                     data={data}
//                     config={config}
//                 />
//             )

//         case "pie":
//             return (
//                 <PieChartComponent
//                     data={data}
//                     config={config}
//                 />
//             )

//         case "area":
//             return (
//                 <AreaChartComponent
//                     data={data}
//                     config={config}
//                 />
//             )

//         case "kpi":
//             return (
//                 <KpiCard
//                     data={data}
//                     config={config}
//                 />
//             )

//         default:
//             return null
//     }
// }

"use client"

import dynamic from "next/dynamic"
import { VisualizationConfig } from "../types/visualization.types"
import { KpiCard } from "./kpi-card"

// Dynamically import chart components with a skeleton loading states
const BarChartComponent = dynamic(
    () => import("./bar-chart").then(mod => mod.BarChartComponent),
    { ssr: false, loading: () => <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-xl border border-slate-800" /> }
)

const LineChartComponent = dynamic(
    () => import("./line-chart").then(mod => mod.LineChartComponent),
    { ssr: false, loading: () => <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-xl border border-slate-800" /> }
)

const PieChartComponent = dynamic(
    () => import("./pie-chart").then(mod => mod.PieChartComponent),
    { ssr: false, loading: () => <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-xl border border-slate-800" /> }
)

const AreaChartComponent = dynamic(
    () => import("./area-chart").then(mod => mod.AreaChartComponent),
    { ssr: false, loading: () => <div className="h-[300px] w-full bg-slate-900 animate-pulse rounded-xl border border-slate-800" /> }
)

interface Props {
    data: any[]
    config: VisualizationConfig
}

export function ChartRenderer({ data, config }: Props) {
    switch (config.type) {
        case "bar":
            return <BarChartComponent data={data} config={config} />
        case "line":
            return <LineChartComponent data={data} config={config} />
        case "pie":
            return <PieChartComponent data={data} config={config} />
        case "area":
            return <AreaChartComponent data={data} config={config} />
        case "kpi":
            return <KpiCard data={data} config={config} />
        default:
            return null
    }
}
