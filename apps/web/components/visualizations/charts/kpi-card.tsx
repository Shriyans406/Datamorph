"use client"

interface Props {
    data: any[]
    config: any
}

export function KpiCard({
    data,
    config,
}: Props) {
    const total = data.reduce(
        (acc, row) => acc + Number(row[config.metric] || 0),
        0
    )

    const formattedTotal = typeof total === "number" && !isNaN(total)
        ? total % 1 === 0
            ? total.toLocaleString()
            : total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0"

    return (
        <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 font-sans">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {config.title || "Key Metric"}
            </p>

            <h2 className="text-3xl font-extrabold text-white mt-2 font-mono">
                {formattedTotal}
            </h2>
        </div>
    )
}