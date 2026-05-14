import {
    ComputedColumn,
} from "../types/query.types"

import { evaluateExpression } from "../expressions/evaluate-expression"

export function applyComputedColumns(
    rows: Record<string, any>[],
    computedColumns: ComputedColumn[]
) {
    return rows.map((row) => {
        const computedRow = {
            ...row,
        }

        computedColumns.forEach(
            (column) => {
                computedRow[
                    column.name
                ] =
                    evaluateExpression(
                        row,
                        column.expression
                    )
            }
        )

        return computedRow
    })
}