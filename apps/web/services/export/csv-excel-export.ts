// Pure-browser CSV/Excel export — no xlsx dependency required

/**
 * Triggers a real file download in the browser.
 * Uses a setTimeout to ensure the blob URL stays alive long enough
 * for the browser to process the download before it's revoked.
 */
function triggerDownload(url: string, filename: string) {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Delay revoke so browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
    if (rows.length === 0 && headers.length === 0) return

    const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`

    const csvLines: string[] = [
        headers.map(h => `"${String(h ?? "").replace(/"/g, '""')}"`).join(","),
        ...rows.map(row =>
            headers.map((_h, ci) => {
                const val = row[ci] === null || row[ci] === undefined ? "" : String(row[ci])
                return `"${val.replace(/"/g, '""')}"`
            }).join(",")
        )
    ]

    const csvContent = csvLines.join("\r\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, safeFilename)
}

/**
 * Exports multiple data sheets as individual CSV files,
 * staggered so browsers don't block simultaneous download triggers.
 */
export function exportToExcel(
    baseFilename: string,
    sheets: { name: string; headers: string[]; rows: any[][] }[]
) {
    const validSheets = sheets.filter(s => s.rows.length > 0)
    if (validSheets.length === 0) return

    validSheets.forEach((sheet, idx) => {
        setTimeout(() => {
            const name = (sheet.name || `sheet_${idx + 1}`)
                .replace(/[/\\?*[\]:]/g, "_")
                .substring(0, 30)
            exportToCSV(`${baseFilename}_${name}.csv`, sheet.headers, sheet.rows)
        }, idx * 300) // 300ms gap to reliably avoid browser download blocking
    })
}
