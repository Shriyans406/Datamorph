import Papa from "papaparse"

export async function parseCSV(file: File) {
    return new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,

            // Auto-detect delimiter: comma, semicolon, tab, pipe
            delimitersToGuess: [",", ";", "\t", "|"],

            complete(results) {
                resolve(results.data as any[])
            },

            error(error) {
                reject(error)
            },
        })
    })
}