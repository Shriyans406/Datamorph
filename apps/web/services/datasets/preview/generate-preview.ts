export function generatePreview(
    rows: Record<string, any>[],
    limit = 10
) {
    return rows.slice(0, limit)
}