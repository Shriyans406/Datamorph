"use client"

import { useEffect, useState } from "react"

import { getDashboards } from "@/services/dashboard/persistence/dashboard.persistence"

export default function DashboardListPage() {
    const [
        dashboards,
        setDashboards,
    ] = useState<any[]>([])

    useEffect(() => {
        load()
    }, [])

    async function load() {
        const result =
            await getDashboards()

        setDashboards(result)
    }

    return (
        <main className="p-8 space-y-4">
            <div>
                <h1 className="text-3xl font-bold">
                    Dashboards
                </h1>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {dashboards.map(
                    (dashboard) => (
                        <div
                            key={
                                dashboard.id
                            }
                            className="border rounded-2xl p-4"
                        >
                            <h2 className="font-semibold">
                                {
                                    dashboard.name
                                }
                            </h2>

                            <p className="text-sm text-muted-foreground mt-2">
                                {
                                    dashboard.description
                                }
                            </p>
                        </div>
                    )
                )}
            </div>
        </main>
    )
}