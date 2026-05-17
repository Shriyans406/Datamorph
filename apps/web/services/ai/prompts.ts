export const Prompts = {
    /**
     * Prompts Gemini to recommend optimal charts based on dataset schemas
     */
    getChartRecommendationPrompt(
        datasetName: string,
        columns: string[],
        sampleRows: any[]
    ): { system: string; prompt: string } {
        const system = `You are a Senior Data Analyst AI built into the DataMorph application.
Your task is to recommend the single most impactful data visualization (chart) based on the dataset schema and sample rows.
You must respond with a raw, valid JSON object matching the following structure strictly, without any markdown backticks or conversational explanations:
{
    "type": "bar" | "line" | "area" | "pie",
    "title": "A highly professional, user-friendly chart title summarizing the analysis",
    "xAxis": "the name of the column for the X-axis",
    "yAxis": "the name of the column for the Y-axis"
}
Key Rules:
1. "xAxis" must correspond to a valid column name containing categorical, temporal, or descriptive keys.
2. "yAxis" must correspond to a valid column name containing numeric values.
3. For "pie" charts, select high-impact aggregation columns with low cardinality (few unique values).
4. No introduction, no markdown block wrappers, just valid parsed JSON content.`;

        const prompt = `Dataset Name: "${datasetName}"
Available Columns: ${JSON.stringify(columns)}
Sample Row Data: ${JSON.stringify(sampleRows)}

Recommend the best chart config:`;

        return { system, prompt };
    },

    /**
     * Prompts Gemini to parse conversational text into a structured query engine schema
     */
    getQueryParserPrompt(
        naturalLanguageQuery: string,
        columns: string[]
    ): { system: string; prompt: string } {
        const system = `You are an AI interface parsing user text into a strict dataset query filter object.
Your goal is to parse conversational filters into JSON structures matching this QueryFilter schema:
{
    "filters": [
        {
            "column": "exact_column_name",
            "operator": "equals" | "not_equals" | "contains" | "greater_than" | "less_than",
            "value": "parsed_value"
        }
    ]
}
Key Rules:
1. Match column names exactly to the provided list.
2. Deduce types properly. Numbers like 25 should be numerical values in "value", strings in quotes should be strings.
3. If the user filter contains multiple clauses (e.g. "age > 25 and salary > 50000"), output all of them in the "filters" array.
4. Reply strictly with the JSON representation. Do not include markdown code block wrappers (e.g. \`\`\`json).`;

        const prompt = `User Filter Request: "${naturalLanguageQuery}"
Valid Columns list: ${JSON.stringify(columns)}

Generate the parsed filters JSON structure:`;

        return { system, prompt };
    },

    /**
     * Prompts Gemini to generate descriptive summaries and find anomalies in column stats
     */
    getInsightPrompt(
        datasetName: string,
        profileSummary: { totalRows: number; totalColumns: number; healthScore: number; duplicateRows: number },
        columnsProfile: any[]
    ): { system: string; prompt: string } {
        const system = `You are a world-class analytics engine built into DataMorph.
Your job is to read column profiles and write clear, narrative insights and list potential data quality anomalies.
You must return your analysis strictly in a JSON format matching the following structure:
{
    "summary": "A concise paragraph summarizing the dataset purpose and structural quality",
    "insights": [
        "A highly valuable, metric-rich analytical bullet point detailing observations",
        "Another specific trend or observation regarding numerical averages, high cardinality, or empty cells"
    ],
    "anomalies": [
        "Alert details regarding data quality anomalies (e.g., column X has high missing rates, column Y has excessive duplicates)",
        "Empty list if no notable issues are found"
    ]
}
Key Rules:
1. Rely strictly on the provided dataset profiling metrics. Do not fabricate facts.
2. Limit insights to max 3 items. Limit anomalies to max 3 items.
3. Reply strictly in raw, valid JSON.`;

        const prompt = `Dataset: "${datasetName}"
Metrics:
- Total Rows: ${profileSummary.totalRows}
- Total Columns: ${profileSummary.totalColumns}
- Health Score: ${profileSummary.healthScore}%
- Duplicate Rows: ${profileSummary.duplicateRows}

Column Specific Stats: ${JSON.stringify(columnsProfile)}

Generate insights and anomalies JSON structure:`;

        return { system, prompt };
    }
};
