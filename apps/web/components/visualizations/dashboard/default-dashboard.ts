export const defaultDashboard =
    [
        {
            id: "1",

            layout: {
                x: 0,
                y: 0,
                w: 6,
                h: 8,
            },

            visualization: {
                id: "chart1",

                type: "bar",

                title:
                    "Bar Visualization",

                xAxis: "country",

                yAxis: "sales",
            },
        },

        {
            id: "2",

            layout: {
                x: 6,
                y: 0,
                w: 6,
                h: 8,
            },

            visualization: {
                id: "chart2",

                type: "line",

                title:
                    "Trend Analysis",

                xAxis: "month",

                yAxis: "revenue",
            },
        },
    ]