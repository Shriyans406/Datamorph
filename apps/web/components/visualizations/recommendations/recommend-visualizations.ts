export function recommendVisualizations(
    columns: any[]
) {
    const recommendations =
        []

    const numeric =
        columns.filter(
            (column) =>
                column.type ===
                "number"
        )

    const categorical =
        columns.filter(
            (column) =>
                column.type ===
                "string"
        )

    if (
        categorical.length &&
        numeric.length
    ) {
        recommendations.push({
            type: "bar",

            title:
                "Bar Chart Recommendation",

            xAxis:
                categorical[0].name,

            yAxis:
                numeric[0].name,
        })

        recommendations.push({
            type: "pie",

            title:
                "Pie Chart Recommendation",

            xAxis:
                categorical[0].name,

            yAxis:
                numeric[0].name,
        })
    }

    return recommendations
}