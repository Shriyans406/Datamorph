"use client"

import { useEffect } from "react"

import { saveDashboard } from "../persistence/dashboard.persistence"

export function useDashboardAutosave(
    dashboard: any
) {
    useEffect(() => {
        if (!dashboard)
            return

        const timeout =
            setTimeout(() => {
                saveDashboard(
                    dashboard
                )
            }, 2000)

        return () =>
            clearTimeout(timeout)
    }, [dashboard])
}