import { DatasetQuery } from "@/services/datasets/query-engine/types/query.types";

export class FallbackEngine {
    /**
     * Determines a basic layout chart recommendation when Gemini is down
     */
    fallbackChart(columns: string[], sampleRows: any[]): Record<string, any> {
        if (columns.length === 0) {
            return {
                type: "bar",
                title: "Data Overview",
                xAxis: "",
                yAxis: ""
            };
        }

        // Try to identify a numeric column
        const numericCol = this.findFirstNumericColumn(columns, sampleRows);
        const categoricalCol = columns.find((c) => c !== numericCol) || columns[0];

        return {
            type: "bar",
            title: `Distribution of ${numericCol || columns[0]}`,
            xAxis: categoricalCol,
            yAxis: numericCol || categoricalCol
        };
    }

    /**
     * Fallback query builder. Builds basic filter matches
     */
    fallbackQuery(naturalLanguage: string, columns: string[]): DatasetQuery {
        const text = naturalLanguage.toLowerCase().trim();
        const filters: any[] = [];

        // Basic heuristic: check if user says "age > 25" -> find column and number
        for (const col of columns) {
            const colLower = col.toLowerCase();
            if (text.includes(colLower)) {
                // Check if containing inequality operators
                if (text.includes(">") || text.includes("greater than")) {
                    const match = text.match(/\d+/);
                    if (match) {
                        filters.push({ column: col, operator: "greater_than", value: Number(match[0]) });
                    }
                } else if (text.includes("<") || text.includes("less than")) {
                    const match = text.match(/\d+/);
                    if (match) {
                        filters.push({ column: col, operator: "less_than", value: Number(match[0]) });
                    }
                } else if (text.includes("is") || text.includes("equals") || text.includes("=")) {
                    const value = text.split("=")[1] || text.split("is")[1];
                    if (value) {
                        filters.push({ column: col, operator: "equals", value: value.trim().replace(/['"]/g, "") });
                    }
                }
            }
        }

        return { filters };
    }

    /**
     * Fallback text summary generator
     */
    fallbackInsight(
        datasetName: string,
        profileSummary: any,
        columnsProfile: any[]
    ): Record<string, any> {
        const anomalies: string[] = [];

        if (profileSummary.duplicateRows > 0) {
            anomalies.push(`Found ${profileSummary.duplicateRows} duplicate rows in the dataset.`);
        }

        columnsProfile.forEach((col) => {
            if (col.nullCount > 0) {
                const pct = Math.round((col.nullCount / profileSummary.totalRows) * 100);
                anomalies.push(`Column "${col.column}" has ${pct}% missing values (${col.nullCount} nulls).`);
            }
        });

        return {
            summary: `Automated summary for dataset "${datasetName}". The dataset contains ${profileSummary.totalRows} rows across ${profileSummary.totalColumns} attributes. The overall profile integrity has a health score of ${Math.round(profileSummary.healthScore)}%.`,
            insights: [
                `Parsed schema with key dimensions including: ${columnsProfile.slice(0, 3).map(c => c.column).join(", ")}.`,
                `The dataset has an average profile uniqueness factor of ${Math.round((columnsProfile.filter(c => c.uniqueCount > 0).length / columnsProfile.length) * 100)}%.`
            ],
            anomalies: anomalies.slice(0, 3)
        };
    }

    private findFirstNumericColumn(columns: string[], sampleRows: any[]): string | undefined {
        if (sampleRows.length === 0) return undefined;
        const row = sampleRows[0];
        return columns.find((col) => typeof row[col] === "number");
    }
}

export const fallbackEngine = new FallbackEngine();
