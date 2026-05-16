"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface Props {
    data: any[]

    config: any
}

export function AreaChartComponent({
    data,
    config,
}: Props) {
    return (
        <div className="h-[300px]">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <AreaChart data={data}>
                    <XAxis
                        dataKey={
                            config.xAxis
                        }
                    />

                    <YAxis />

                    <Tooltip />

                    <Area
                        type="monotone"
                        dataKey={
                            config.yAxis
                        }
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}