import { nanoid } from "nanoid"

import { parseFile } from "./parser/parse-file"
import { inferSchema } from "./schema/infer-schema"
import { generateStatistics } from "./statistics/generate-statistics"
import { generateQualityReport } from "./quality/quality-report"
import { generatePreview } from "./preview/generate-preview"

import { generateDatasetProfile } from "./profiling/generate-profile"

export async function processDataset(file: File) {
    const rows = await parseFile(file)

    const schema = inferSchema(rows)

    const statistics = generateStatistics(rows)

    const quality = generateQualityReport(rows)

    const preview = generatePreview(rows)

    const profile =
        generateDatasetProfile(rows)

    return {
        id: nanoid(),

        metadata: {
            name: file.name,
            rows: rows.length,
            columns: schema.columns.length,
            uploadedAt: new Date().toISOString(),
        },

        schema,
        statistics,
        quality,
        preview,
        profile,
        rows,
    }
}