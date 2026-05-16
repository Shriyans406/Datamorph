"use client"

import {
    PieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface Props {
    data: any[]

    config: any
}

export function PieChartComponent({
    data,
    config,
}: Props) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={
                            config.yAxis
                        }
                        nameKey={
                            config.xAxis
                        }
                    />

                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}