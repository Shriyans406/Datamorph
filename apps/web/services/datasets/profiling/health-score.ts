export function calculateHealthScore(
    completeness: number,
    duplicates: number,
    totalRows: number
) {
    let score = completeness

    const duplicatePenalty =
        (duplicates / totalRows) * 100

    score -= duplicatePenalty

    return Math.max(
        0,
        Math.min(100, score)
    )
}