import { parseCSV } from "./csv.parser"
import { parseExcel } from "./excel.parser"

export async function parseFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (extension === "csv") {
        return parseCSV(file)
    }

    if (extension === "xlsx" || extension === "xls") {
        return parseExcel(file)
    }

    throw new Error("Unsupported file type")
}