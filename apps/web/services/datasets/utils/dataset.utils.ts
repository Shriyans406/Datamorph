export function isNumeric(value: any) {
    return !isNaN(parseFloat(value))
}

export function isBoolean(value: any) {
    return value === "true" || value === "false"
}

export function isDate(value: any) {
    return !isNaN(Date.parse(value))
}