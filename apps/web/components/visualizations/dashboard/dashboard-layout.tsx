"use client"

import dynamic from "next/dynamic"

const GridLayout = dynamic(
    () =>
        import(
            "react-grid-layout"
        ),
    {
        ssr: false,
    }
)

import { DashboardWidget } from "../widgets/dashboard-widget"

interface Props {
    data: any[]

    widgets: any[]
}

export function DashboardLayout({
    data,
    widgets,
}: Props) {
    return (
        <GridLayout
            className="layout"
            gridConfig={{
                cols: 12,
                rowHeight: 40,
            }}
            width={
                typeof window !==
                    "undefined"
                    ? window.innerWidth -
                    100
                    : 1200
            }
        >
            {widgets.map((widget) => (
                <div
                    key={widget.id}
                    data-grid={
                        widget.layout
                    }
                >
                    <DashboardWidget
                        data={data}
                        widget={widget}
                    />
                </div>
            ))}
        </GridLayout>
    )
}