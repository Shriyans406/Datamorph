"use client"

import dynamic from "next/dynamic"
import { DashboardWidgetCard } from "../widgets/dashboard-widget-card"

const GridLayout = dynamic(
    () => import("react-grid-layout"),
    { ssr: false }
)
const ReactGridLayout = GridLayout as any

interface Props {
    widgets: any[]
    dataMap: Record<string, any[]>
    isEditable: boolean;
}

export function DashboardGrid({
    widgets,
    dataMap,
    isEditable,
}: Props) {
    return (
        <ReactGridLayout
            className="layout"
            gridConfig={{
                cols: 12,
                rowHeight: 40
            }}
            isDraggable={isEditable}
            isResizable={isEditable}
            width={
                typeof window !== "undefined"
                    ? window.innerWidth - 100
                    : 1200
            }
        >
            {widgets.map(
                (widget) => (
                    <div
                        key={widget.id}
                        data-grid={widget.layout}
                    >
                        <DashboardWidgetCard
                            widget={widget}
                            data={dataMap[widget.datasetId] || []}
                        />
                    </div>
                )
            )}
        </ReactGridLayout>
    )
}