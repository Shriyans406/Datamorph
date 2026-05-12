export function generateQualityReport(
    rows: Record<string, any>[]
) {
    if (!rows.length) {
        return null
    }

    const columns = Object.keys(rows[0])

    const report = columns.map((column) => {
        const values = rows.map((row) => row[column])

        const missing = values.filter(
            (v) => v === null || v === undefined || v === ""
        ).length

        return {
            column,
            missing,
            completeness:
                ((values.length - missing) / values.length) * 100,
        }
    })

    return report
}