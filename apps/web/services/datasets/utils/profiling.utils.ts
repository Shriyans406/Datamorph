export function calculateMedian(
    values: number[]
) {
    const sorted = [...values].sort(
        (a, b) => a - b
    )

    const middle = Math.floor(
        sorted.length / 2
    )

    if (sorted.length % 2 === 0) {
        return (
            (sorted[middle - 1] +
                sorted[middle]) /
            2
        )
    }

    return sorted[middle]
}

export function frequencyMap(
    values: any[]
) {
    const map = new Map<
        string,
        number
    >()

    values.forEach((value) => {
        const key = String(value)

        map.set(
            key,
            (map.get(key) || 0) + 1
        )
    })

    return map
}