"use client"

import { useState } from "react"

import { DashboardLayout } from "@/components/visualizations/dashboard/dashboard-layout"

import { defaultDashboard } from "@/components/visualizations/dashboard/default-dashboard"

import { VisualizationToolbar } from "@/components/visualizations/toolbar/visualization-toolbar"

const mockData = [
    {
        country: "India",
        sales: 100,
        revenue: 300,
        month: "Jan",
    },

    {
        country: "USA",
        sales: 200,
        revenue: 450,
        month: "Feb",
    },

    {
        country: "UK",
        sales: 150,
        revenue: 350,
        month: "Mar",
    },
]

export default function DashboardBuilderPage() {
    const [widgets, setWidgets] =
        useState(defaultDashboard)

    function addChart(
        type: string
    ) {
        setWidgets((prev) => [
            ...prev,

            {
                id: crypto.randomUUID(),

                layout: {
                    x: 0,
                    y: Infinity,
                    w: 6,
                    h: 8,
                },

                visualization: {
                    id:
                        crypto.randomUUID(),

                    type,

                    title:
                        `${type} chart`,

                    xAxis:
                        "country",

                    yAxis:
                        "sales",
                },
            },
        ])
    }

    return (
        <main className="p-10 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Dashboard Builder
                </h1>

                <p className="text-muted-foreground">
                    Build interactive BI dashboards
                </p>
            </div>

            <VisualizationToolbar
                onAddChart={addChart}
            />

            <DashboardLayout
                data={mockData}
                widgets={widgets}
            />
        </main>
    )
}