import {
    QueryAggregation,
} from "../types/query.types"

export function applyAggregations(
    rows: Record<string, any>[],
    aggregations: QueryAggregation[]
) {
    const result: Record<
        string,
        any
    > = {}

    aggregations.forEach(
        (aggregation) => {
            const values = rows
                .map((row) =>
                    Number(
                        row[
                        aggregation.column
                        ]
                    )
                )
                .filter(
                    (v) => !isNaN(v)
                )

            switch (
            aggregation.operation
            ) {
                case "sum":
                    result[
                        `${aggregation.operation}_${aggregation.column}`
                    ] =
                        values.reduce(
                            (a, b) => a + b,
                            0
                        )
                    break

                case "avg":
                    result[
                        `${aggregation.operation}_${aggregation.column}`
                    ] =
                        values.reduce(
                            (a, b) => a + b,
                            0
                        ) / values.length
                    break

                case "min":
                    result[
                        `${aggregation.operation}_${aggregation.column}`
                    ] =
                        Math.min(...values)
                    break

                case "max":
                    result[
                        `${aggregation.operation}_${aggregation.column}`
                    ] =
                        Math.max(...values)
                    break

                case "count":
                    result[
                        `${aggregation.operation}_${aggregation.column}`
                    ] =
                        values.length
                    break
            }
        }
    )

    return result
}