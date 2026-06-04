import { ConnectorConfig } from "@/types/connectors.types"

export async function fetchAirtableRows(config: ConnectorConfig): Promise<Record<string, any>[]> {
    if (config.simulate || !config.personalAccessToken) {
        // Return structured mock Airtable records
        return [
            { "Client Name": "Starlight Industries", "Deal Value": 85000, "Sales Owner": "Michael Scott", "Stage": "Proposal" },
            { "Client Name": "Acme Widgets", "Deal Value": 32000, "Sales Owner": "Dwight Schrute", "Stage": "Qualification" },
            { "Client Name": "Initech Office Space", "Deal Value": 150000, "Sales Owner": "Jim Halpert", "Stage": "Negotiations" },
            { "Client Name": "Vance Refrigeration", "Deal Value": 95000, "Sales Owner": "Phyllis Vance", "Stage": "Closed Won" }
        ]
    }

    const baseId = config.baseId
    const tableName = config.tableIdOrName || "Table 1"

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
        headers: {
            Authorization: `Bearer ${config.personalAccessToken}`
        }
    })

    if (!response.ok) {
        throw new Error("Airtable API failed: " + (await response.text()))
    }

    const data = await response.json()
    const records = data.records || []

    if (records.length === 0) {
        throw new Error("Airtable table returned 0 records")
    }

    return records.map((r: any) => ({
        id: r.id,
        ...r.fields
    }))
}
