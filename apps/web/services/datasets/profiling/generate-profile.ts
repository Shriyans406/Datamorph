import { inferSchema } from "../schema/infer-schema"

import {
    DatasetProfile,
} from "../types/dataset.types"

import { profileColumn } from "./profile-column"

import { calculateHealthScore } from "./health-score"

export function generateDatasetProfile(
    rows: Record<string, any>[]
): DatasetProfile {
    const schema = inferSchema(rows)

    const columns =
        schema.columns.map((column) =>
            profileColumn(
                column.name,
                rows,
                column.type
            )
        )

    const duplicateRows =
        rows.length -
        new Set(
            rows.map((row) =>
                JSON.stringify(row)
            )
        ).size

    const avgCompleteness =
        columns.reduce(
            (acc, col) =>
                acc + col.completeness,
            0
        ) / columns.length

    const healthScore =
        calculateHealthScore(
            avgCompleteness,
            duplicateRows,
            rows.length
        )

    return {
        totalRows: rows.length,

        totalColumns:
            schema.columns.length,

        duplicateRows,

        healthScore,

        columns,
    }
}