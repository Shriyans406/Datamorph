export function evaluateExpression(
    row: Record<string, any>,
    expression: string
) {
    try {
        const keys =
            Object.keys(row)

        const values =
            Object.values(row)

        const fn = new Function(
            ...keys,
            `return ${expression}`
        )

        return fn(...values)
    } catch {
        return null
    }
}