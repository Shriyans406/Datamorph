interface Props {
    rows: Record<string, any>[]
}

export function DatasetTable({
    rows,
}: Props) {
    if (!rows.length) {
        return (
            <p>No rows available</p>
        )
    }

    const columns = Object.keys(rows[0])

    return (
        <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column}
                                className="text-left p-3"
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, index) => (
                        <tr
                            key={index}
                            className="border-t"
                        >
                            {columns.map((column) => (
                                <td
                                    key={column}
                                    className="p-3"
                                >
                                    {String(
                                        row[column]
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}