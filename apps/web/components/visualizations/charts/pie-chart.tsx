"use client"

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface Props {
    data: any[]
    config: any
}

const COLORS = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#0ea5e9", // Sky
    "#8b5cf6", // Violet
    "#ec4899", // Pink
]

export function PieChartComponent({
    data,
    config,
}: Props) {
    return (
        <div className="h-full w-full font-sans" style={{ minHeight: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                    <Pie
                        data={data}
                        dataKey={config.yAxis}
                        nameKey={config.xAxis}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : 0}%)`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}