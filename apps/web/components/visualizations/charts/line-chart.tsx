"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface Props {
    data: any[]

    config: any
}

export function LineChartComponent({
    data,
    config,
}: Props) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <LineChart data={data}>
                    <XAxis
                        dataKey={
                            config.xAxis
                        }
                    />

                    <YAxis />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey={
                            config.yAxis
                        }
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}