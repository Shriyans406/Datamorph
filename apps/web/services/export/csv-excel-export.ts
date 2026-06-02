import * as XLSX from "xlsx"

export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
    const csvContent = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map(row =>
            row
                .map(val => {
                    const str = val === null || val === undefined ? "" : String(val)
                    return `"${str.replace(/"/g, '""')}"`
                })
                .join(",")
        )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export function exportToExcel(filename: string, sheets: { name: string; headers: string[]; rows: any[][] }[]) {
    const wb = XLSX.utils.book_new()

    sheets.forEach(sheet => {
        const formattedData = [sheet.headers, ...sheet.rows]
        const ws = XLSX.utils.aoa_to_sheet(formattedData)
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31))
    })

    XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`)
}
