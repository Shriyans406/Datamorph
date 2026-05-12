export function generateStatistics(
    rows: Record<string, any>[]
) {
    if (!rows.length) return {}

    const result: Record<string, any> = {}

    const columns = Object.keys(rows[0])

    columns.forEach((column) => {
        const values = rows
            .map((row) => row[column])
            .filter((v) => !isNaN(Number(v)))
            .map(Number)

        if (!values.length) return

        const sum = values.reduce((a, b) => a + b, 0)

        result[column] = {
            min: Math.min(...values),
            max: Math.max(...values),
            mean: sum / values.length,
        }
    })

    return result
}