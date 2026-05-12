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

export interface NumericProfile {
    min: number
    max: number
    mean: number
    median: number
    sum: number
}

export interface CategoricalProfile {
    unique: number
    topValues: {
        value: string
        count: number
    }[]
}

export interface DateProfile {
    minDate: string
    maxDate: string
}

export interface ColumnProfile {
    column: string
    type: DatasetColumnType

    completeness: number

    nullCount: number

    uniqueCount: number

    duplicateCount: number

    numeric?: NumericProfile

    categorical?: CategoricalProfile

    date?: DateProfile
}

export interface DatasetProfile {
    totalRows: number

    totalColumns: number

    duplicateRows: number

    healthScore: number

    columns: ColumnProfile[]
}