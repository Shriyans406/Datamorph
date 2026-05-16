import { create } from "zustand"

export const useDashboardStore =
    create((set) => ({
        dashboard: null,

        setDashboard: (
            dashboard: any
        ) =>
            set({
                dashboard,
            }),

        widgets: [],

        setWidgets: (
            widgets: any[]
        ) =>
            set({
                widgets,
            }),

        filters: [],

        setFilters: (
            filters: any[]
        ) =>
            set({
                filters,
            }),
    }))
