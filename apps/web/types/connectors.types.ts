export type ConnectorType = "google-sheets" | "airtable" | "api"

export interface ConnectorConfig {
    // Google Sheets Config
    spreadsheetId?: string
    range?: string
    accessToken?: string
    refreshToken?: string
    expiry?: number

    // Airtable Config
    baseId?: string
    tableIdOrName?: string
    personalAccessToken?: string

    // REST API Config
    url?: string
    method?: "GET" | "POST"
    headers?: string // JSON string
    body?: string
    jsonPath?: string

    // Simulation Flag
    simulate?: boolean
}

export interface DataConnector {
    id?: string
    userId: string
    name: string
    type: ConnectorType
    status: "active" | "error" | "paused"
    lastSyncAt: string | null
    syncInterval: "manual" | "hourly" | "daily"
    config: ConnectorConfig
    datasetId?: string
    createdAt: string
}

export interface SyncLog {
    id?: string
    connectorId: string
    connectorName: string
    type: ConnectorType
    status: "success" | "failed"
    error: string | null
    syncTime: number
    recordsSynced: number
}
