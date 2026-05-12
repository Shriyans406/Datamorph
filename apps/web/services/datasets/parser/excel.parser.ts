import * as XLSX from "xlsx"

export async function parseExcel(file: File) {
    const buffer = await file.arrayBuffer()

    const workbook = XLSX.read(buffer)

    const sheetName = workbook.SheetNames[0]

    const worksheet = workbook.Sheets[sheetName]

    return XLSX.utils.sheet_to_json(worksheet)
}