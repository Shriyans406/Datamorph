"use client"

import dynamic from "next/dynamic"

import { DashboardWidgetCard } from "../widgets/dashboard-widget-card"

const GridLayout = dynamic(
    () =>
        import(
            "react-grid-layout"
        ),
    {
        ssr: false,
    }
)

interface Props {
    widgets: any[]

    data: any[]
}

export function DashboardGrid({
    widgets,
    data,
}: Props) {
    return (
        <GridLayout
            className="layout"
            gridConfig={{
                cols: 12,
                rowHeight: 40
            }}
            width={
                typeof window !==
                    "undefined"
                    ? window.innerWidth -
                    100
                    : 1200
            }
        >
            {widgets.map(
                (widget) => (
                    <div
                        key={widget.id}
                        data-grid={
                            widget.layout
                        }
                    >
                        <DashboardWidgetCard
                            widget={widget}
                            data={data}
                        />
                    </div>
                )
            )}
        </GridLayout>
    )
}