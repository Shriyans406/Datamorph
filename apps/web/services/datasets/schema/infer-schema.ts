import {
    DatasetColumn,
    DatasetSchema,
} from "../types/dataset.types"

import {
    isBoolean,
    isDate,
    isNumeric,
} from "../utils/dataset.utils"

export function inferSchema(
    rows: Record<string, any>[]
): DatasetSchema {
    if (!rows.length) {
        return { columns: [] }
    }

    const firstRow = rows[0]

    const columns: DatasetColumn[] = Object.keys(firstRow).map(
        (key) => {
            const values = rows.map((row) => row[key])

            let type: DatasetColumn["type"] = "string"

            const sample = values.find(
                (v) => v !== null && v !== undefined
            )

            if (sample) {
                if (isNumeric(sample)) {
                    type = "number"
                } else if (isBoolean(sample)) {
                    type = "boolean"
                } else if (isDate(sample)) {
                    type = "date"
                }
            }

            return {
                name: key,
                type,
                nullable: values.some(
                    (v) => v === null || v === undefined || v === ""
                ),
                uniqueValues: new Set(values).size,
            }
        }
    )

    return { columns }
}