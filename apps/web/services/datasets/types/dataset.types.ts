export type DatasetColumnType =
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "unknown"

export interface DatasetColumn {
    name: string
    type: DatasetColumnType
    nullable: boolean
    uniqueValues: number
}

export interface DatasetMetadata {
    id: string
    name: string
    rows: number
    columns: number
    uploadedAt: string
}

export interface DatasetStatistics {
    numeric?: {
        min: number
        max: number
        mean: number
        median: number
    }

    categorical?: {
        unique: number
        topValues: string[]
    }
}

export interface DatasetSchema {
    columns: DatasetColumn[]
}

export interface ParsedDataset {
    metadata: DatasetMetadata
    schema: DatasetSchema
    rows: Record<string, any>[]
}