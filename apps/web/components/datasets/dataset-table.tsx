"use client"

import { useState, useRef, useEffect, UIEvent } from "react"

interface Props {
    rows: Record<string, any>[]
}

export function DatasetTable({ rows }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(400)

    useEffect(() => {
        if (containerRef.current) {
            setContainerHeight(containerRef.current.clientHeight || 400)
        }
    }, [])

    if (!rows.length) {
        return <p className="text-slate-400 p-4 text-xs">No rows available</p>
    }

    const columns = Object.keys(rows[0])

    // Virtualization settings
    const rowHeight = 40 // Height of each row in px
    const totalHeight = rows.length * rowHeight

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 3)
    const endIndex = Math.min(rows.length - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + 3)

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }

    const visibleRows = rows.slice(startIndex, endIndex + 1)
    const offsetY = startIndex * rowHeight

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-auto border border-slate-800 bg-slate-950 rounded-xl relative max-h-[500px]"
            style={{ height: "400px" }}
        >
            {/* Total height spacer */}
            <div style={{ height: `${totalHeight}px`, width: "100%", position: "absolute", top: 0, left: 0, pointerEvents: "none" }} />

            <table className="w-full text-sm border-collapse" style={{ transform: `translateY(${offsetY}px)`, position: "relative" }}>
                <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
                    <tr style={{ height: `${rowHeight}px` }}>
                        {columns.map((column) => (
                            <th
                                key={column}
                                className="text-left p-3 text-slate-300 font-bold border-r border-slate-800 last:border-0"
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {visibleRows.map((row, index) => (
                        <tr
                            key={startIndex + index}
                            className="border-b border-slate-900/60 hover:bg-slate-900/30"
                            style={{ height: `${rowHeight}px` }}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column}
                                    className="p-3 text-slate-400 border-r border-slate-900 last:border-0 truncate max-w-[200px]"
                                >
                                    {String(row[column] ?? "")}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
