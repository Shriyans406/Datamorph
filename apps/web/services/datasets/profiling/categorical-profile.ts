import { frequencyMap } from "../utils/profiling.utils"

export function profileCategorical(
    values: any[]
) {
    const frequencies =
        frequencyMap(values)

    const topValues = Array.from(
        frequencies.entries()
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
            value,
            count,
        }))

    return {
        unique: frequencies.size,
        topValues,
    }
}