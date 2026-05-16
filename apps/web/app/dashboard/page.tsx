"use client"

import { useState } from "react"

import { DashboardToolbar } from "@/components/dashboard/toolbar/dashboard-toolbar"

import { DashboardGrid } from "@/components/dashboard/layouts/dashboard-grid"

import { GlobalFilters } from "@/components/dashboard/filters/global-filters"

import { saveDashboard } from "@/services/dashboard/persistence/dashboard.persistence"

import { useDashboardAutosave } from "@/services/dashboard/hooks/use-dashboard-autosave"

import { executeQuery } from "@/services/datasets/query-engine/pipeline/execute-query"

import { DashboardFilter } from "@/services/dashboard/types/dashboard.types"

const mockData = [
    {
        country: "India",
        sales: 100,
        revenue: 300,
    },

    {
        country: "USA",
        sales: 200,
        revenue: 450,
    },

    {
        country: "UK",
        sales: 150,
        revenue: 350,
    },
]

export default function DashboardPage() {
    const [widgets, setWidgets] =
        useState([
            {
                id: "1",

                type: "bar_chart",

                title:
                    "Sales by Country",

                datasetId: "dataset_1",

                layout: {
                    x: 0,
                    y: 0,
                    w: 6,
                    h: 8,
                },

                config: {
                    type: "bar",

                    title:
                        "Sales",

                    xAxis:
                        "country",

                    yAxis:
                        "sales",
                },
            },
        ])

    const [filters, setFilters] =
        useState<DashboardFilter[]>([])

    async function handleSave() {
        await saveDashboard({
            id: "dashboard_1",

            name:
                "Executive Dashboard",

            widgets,

            filters,

            createdAt: Date.now(),

            updatedAt: Date.now(),
        } as any)

        alert(
            "Dashboard Saved"
        )
    }

    useDashboardAutosave({
        id: "dashboard_1",

        name:
            "Executive Dashboard",

        widgets,

        filters,

        createdAt: Date.now(),

        updatedAt: Date.now(),
    })

    function addWidget() {
        setWidgets((prev) => [
            ...prev,

            {
                id:
                    crypto.randomUUID(),

                type:
                    "line_chart",

                title:
                    "Revenue Trends",

                datasetId:
                    "dataset_1",

                layout: {
                    x: 0,
                    y: Infinity,
                    w: 6,
                    h: 8,
                },

                config: {
                    type: "line",

                    title:
                        "Revenue",

                    xAxis:
                        "country",

                    yAxis:
                        "revenue",
                },
            },
        ])
    }

    const filteredData =
        executeQuery(mockData, {
            filters,
        }).rows

    return (
        <main className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Dashboard Builder
                </h1>

                <p className="text-muted-foreground">
                    Build enterprise analytics dashboards
                </p>
            </div>

            <DashboardToolbar
                onSave={handleSave}
                onAddWidget={
                    addWidget
                }
            />

            <GlobalFilters
                filters={filters}
                onChange={setFilters}
            />

            <DashboardGrid
                widgets={widgets}
                data={filteredData}
            />
        </main>
    )
}