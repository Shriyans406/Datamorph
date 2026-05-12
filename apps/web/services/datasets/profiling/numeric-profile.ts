import { calculateMedian } from "../utils/profiling.utils"

export function profileNumeric(
    values: number[]
) {
    const sum = values.reduce(
        (a, b) => a + b,
        0
    )

    return {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: sum / values.length,
        median: calculateMedian(values),
        sum,
    }
}