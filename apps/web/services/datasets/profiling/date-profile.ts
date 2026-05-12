export function profileDate(
    values: string[]
) {
    const dates = values.map(
        (v) => new Date(v)
    )

    const timestamps = dates.map((d) =>
        d.getTime()
    )

    return {
        minDate: new Date(
            Math.min(...timestamps)
        ).toISOString(),

        maxDate: new Date(
            Math.max(...timestamps)
        ).toISOString(),
    }
}