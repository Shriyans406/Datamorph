export interface StructuredQuery {
    filters?: { column: string; operator: string; value: any }[];
    grouping?: string[];
    aggregations?: { column: string; type: "sum" | "avg" | "count" | "min" | "max"; alias?: string }[];
    sorting?: { column: string; direction: "asc" | "desc" }[];
    limit?: number | null;
}

export function executeQuery(rows: any[], query: StructuredQuery): any[] {
    let result = [...rows];

    // 1. Filtering
    if (query.filters && query.filters.length > 0) {
        result = result.filter(row => {
            return query.filters!.every(f => {
                const rowVal = row[f.column];
                if (rowVal === undefined || rowVal === null) return false;

                const numRowVal = Number(rowVal);
                const numVal = Number(f.value);
                const isNum = !isNaN(numRowVal) && !isNaN(numVal);

                switch (f.operator) {
                    case "equals": return rowVal == f.value;
                    case "not_equals": return rowVal != f.value;
                    case "contains": return String(rowVal).toLowerCase().includes(String(f.value).toLowerCase());
                    case "greater_than": return isNum ? numRowVal > numVal : rowVal > f.value;
                    case "less_than": return isNum ? numRowVal < numVal : rowVal < f.value;
                    default: return true;
                }
            });
        });
    }

    // 2. Grouping & Aggregation
    if (query.grouping && query.grouping.length > 0) {
        const groups = new Map<string, any[]>();
        const groupCols = query.grouping;

        result.forEach(row => {
            const key = groupCols.map(c => row[c]).join("|||");
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(row);
        });

        result = Array.from(groups.entries()).map(([keyStr, groupRows]) => {
            const keys = keyStr.split("|||");
            const outRow: any = {};
            groupCols.forEach((c, i) => outRow[c] = keys[i]);

            if (query.aggregations) {
                query.aggregations.forEach(agg => {
                    const colName = agg.alias || `${agg.type}_${agg.column}`;
                    const values = groupRows.map(r => Number(r[agg.column])).filter(v => !isNaN(v));

                    if (agg.type === "count") outRow[colName] = groupRows.length;
                    else if (values.length === 0) outRow[colName] = 0;
                    else if (agg.type === "sum") outRow[colName] = values.reduce((a, b) => a + b, 0);
                    else if (agg.type === "avg") outRow[colName] = values.reduce((a, b) => a + b, 0) / values.length;
                    else if (agg.type === "max") outRow[colName] = Math.max(...values);
                    else if (agg.type === "min") outRow[colName] = Math.min(...values);
                });
            }
            return outRow;
        });
    }

    // 3. Sorting
    if (query.sorting && query.sorting.length > 0) {
        result.sort((a, b) => {
            for (const sort of query.sorting!) {
                const valA = a[sort.column];
                const valB = b[sort.column];
                if (valA === valB) continue;

                const numA = Number(valA);
                const numB = Number(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return sort.direction === "asc" ? numA - numB : numB - numA;
                }
                return sort.direction === "asc"
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            }
            return 0;
        });
    }

    // 4. Limit
    if (query.limit && query.limit > 0) {
        result = result.slice(0, query.limit);
    }

    return result;
}
