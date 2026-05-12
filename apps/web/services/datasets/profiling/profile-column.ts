import {
    ColumnProfile,
} from "../types/dataset.types"

import { profileNumeric } from "./numeric-profile"

import { profileCategorical } from "./categorical-profile"

import { profileDate } from "./date-profile"

export function profileColumn(
    column: string,
    rows: Record<string, any>[],
    type: string
): ColumnProfile {
    const values = rows.map(
        (row) => row[column]
    )

    const nullCount = values.filter(
        (v) =>
            v === null ||
            v === undefined ||
            v === ""
    ).length

    const uniqueCount = new Set(values)
        .size

    const duplicateCount =
        values.length - uniqueCount

    const completeness =
        ((values.length - nullCount) /
            values.length) *
        100

    const profile: ColumnProfile = {
        column,
        type: type as any,

        completeness,

        nullCount,

        uniqueCount,

        duplicateCount,
    }

    if (type === "number") {
        profile.numeric =
            profileNumeric(
                values.map(Number)
            )
    }

    if (type === "string") {
        profile.categorical =
            profileCategorical(values)
    }

    if (type === "date") {
        profile.date =
            profileDate(values)
    }

    return profile
}