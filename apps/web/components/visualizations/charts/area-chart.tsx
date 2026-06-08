"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"

interface Props {
    data: any[]
    config: any
}

export function AreaChartComponent({
    data,
    config,
}: Props) {
    const formatTick = (val: any) => {
        if (typeof val === "number") {
            return Number(val.toFixed(2)).toString()
        }
        if (typeof val === "string") {
            const num = Number(val)
            if (!isNaN(num)) {
                return Number(num.toFixed(2)).toString()
            }
            if (val.length > 12) {
                return `${val.substring(0, 10)}...`
            }
        }
        return String(val)
    }

    return (
        <div className="h-full w-full font-sans" style={{ minHeight: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="areaIndigoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#334155" opacity={0.25} vertical={false} />
                    <XAxis
                        dataKey={config.xAxis}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={formatTick}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={formatTick}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#1e293b",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                            fontFamily: "var(--font-sans), sans-serif",
                            fontSize: "11px",
                        }}
                        itemStyle={{ color: "#818cf8" }}
                        labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                    />
                    <Area
                        type="monotone"
                        dataKey={config.yAxis}
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#areaIndigoGrad)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}