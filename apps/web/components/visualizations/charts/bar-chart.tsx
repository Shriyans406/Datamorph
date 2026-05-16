"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface Props {
    data: any[]

    config: any
}

export function BarChartComponent({
    data,
    config,
}: Props) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <BarChart data={data}>
                    <XAxis
                        dataKey={
                            config.xAxis
                        }
                    />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey={
                            config.yAxis
                        }
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}