import { FilterOperator } from "@/services/datasets/query-engine/types/query.types"

export interface DashboardLayout {
    x: number
    y: number
    w: number
    h: number
}

export interface DashboardFilter {
    id: string

    column: string

    operator: FilterOperator

    value: any
}

export interface DashboardWidget {
    id: string

    dashboardId: string

    type: string

    title: string

    datasetId: string

    layout: DashboardLayout

    config: Record<string, any>
}

export interface DashboardVersion {
    id: string

    dashboardId: string

    version: number

    widgets: DashboardWidget[]

    createdAt: number
}

export interface Dashboard {
    id: string

    name: string

    description?: string

    widgets: DashboardWidget[]

    filters: DashboardFilter[]

    createdAt: number

    updatedAt: number
}