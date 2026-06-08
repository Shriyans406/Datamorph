"use client"

import { BarChart3 } from "lucide-react"

export function ChartEmpty() {
    return (
        <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-500 gap-2 p-6 font-sans">
            <BarChart3 className="w-8 h-8 opacity-25 text-indigo-400" />
            <p className="text-xs font-semibold">
                No visualization data available
            </p>
        </div>
    )
}