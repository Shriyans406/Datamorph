"use client"

import { useEffect, useState } from "react"
import { BarChartComponent } from "@/components/visualizations/charts/bar-chart"
import { LineChartComponent } from "@/components/visualizations/charts/line-chart"
import { AreaChartComponent } from "@/components/visualizations/charts/area-chart"
import { PieChartComponent } from "@/components/visualizations/charts/pie-chart"
import { Sparkles, AlertTriangle, Lightbulb, TrendingUp, BarChart3 } from "lucide-react"

interface Props {
    dataset: {
        metadata: {
            name: string;
            rows: number;
            columns: number;
        };
        schema: {
            columns: { name: string; type: string }[];
        };
        rows: Record<string, any>[];
        profile: {
            totalRows: number;
            totalColumns: number;
            healthScore: number;
            duplicateRows: number;
            columns: any[];
        };
    };
}

export function AIInsightsPanel({ dataset }: Props) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [insightData, setInsightData] = useState<{
        summary: string;
        insights: string[];
        anomalies: string[];
    } | null>(null)
    const [chartConfig, setChartConfig] = useState<{
        type: string;
        title: string;
        xAxis: string;
        yAxis: string;
    } | null>(null)

    // Active chart config currently being displayed (can be overridden by user clicks)
    const [activeChart, setActiveChart] = useState<{
        type: string;
        title: string;
        xAxis: string;
        yAxis: string;
        customized?: boolean;
    } | null>(null)

    useEffect(() => {
        if (!dataset) return

        async function fetchAIInsights() {
            setLoading(true)
            setError(null)
            try {
                // 1. Fetch Summaries & Narrative Insights
                const insightResponse = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "insight",
                        datasetName: dataset.metadata.name,
                        profileSummary: {
                            totalRows: dataset.profile.totalRows,
                            totalColumns: dataset.profile.totalColumns,
                            healthScore: dataset.profile.healthScore,
                            duplicateRows: dataset.profile.duplicateRows,
                        },
                        columnsProfile: (dataset.profile.columns ?? []).slice(0, 10), // Limit payload size
                    }),
                })

                if (!insightResponse.ok) throw new Error("Failed to fetch narrative insights")
                const insightResult = await insightResponse.json()

                // 2. Fetch Best Chart Recommendation
                const columnNames = dataset.schema.columns.map((c) => c.name)
                const chartResponse = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "chart",
                        datasetName: dataset.metadata.name,
                        columns: columnNames,
                        sampleRows: dataset.rows.slice(0, 15), // Provide representative sample
                    }),
                })

                if (!chartResponse.ok) throw new Error("Failed to fetch chart recommendation")
                const chartResult = await chartResponse.json()

                setInsightData(insightResult.data)
                setChartConfig(chartResult.data)
                setActiveChart(chartResult.data)
            } catch (err: any) {
                console.error("AI Insights fetch failed: ", err)
                setError(err.message || "An unexpected error occurred while generating insights")
            } finally {
                setLoading(false)
            }
        }

        fetchAIInsights()
    }, [dataset])

    // Interactive linking callback: plots the selected column instantly
    const handleExploreColumn = (columnName: string, type: "anomaly" | "insight") => {
        if (!dataset.rows || dataset.rows.length === 0) return

        // Find a suitable numerical column to pair for Y-axis
        const numCol = dataset.schema.columns.find(
            (c) => c.type === "number" && c.name !== columnName
        )
        const targetY = numCol ? numCol.name : columnName

        setActiveChart({
            type: "bar",
            title: `Exploratory Analysis: Distribution of "${columnName}"`,
            xAxis: columnName,
            yAxis: targetY,
            customized: true,
        })
    }

    const resetChartToAI = () => {
        if (chartConfig) {
            setActiveChart(chartConfig)
        }
    }

    if (loading) {
        return (
            <div className="border border-indigo-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-slate-900/50 dark:to-slate-900/50 p-6 rounded-2xl animate-pulse space-y-6">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-20 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    </div>
                    <div className="h-[280px] bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
            </div>
        )
    }

    if (error || !insightData || !activeChart) {
        return (
            <div className="border border-red-200 bg-red-50/30 dark:border-red-950/20 dark:bg-red-950/5 p-6 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-lg">AI Integration Offline</h3>
                    <p className="text-sm opacity-90">{error || "Could not connect to the insight engine."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="border border-indigo-100 dark:border-slate-800 bg-gradient-to-br from-indigo-50/20 via-purple-50/10 to-transparent dark:from-slate-900/40 dark:via-purple-950/5 dark:to-transparent p-6 rounded-2xl space-y-6 shadow-sm">
            {/* Title Block */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">AI Insights & Exploration</h2>
                        <p className="text-xs text-muted-foreground">Automated observations, anomalies, and structural charts powered by Gemini</p>
                    </div>
                </div>
                {activeChart.customized && (
                    <button
                        onClick={resetChartToAI}
                        className="text-xs border border-indigo-200 text-indigo-600 dark:border-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all font-medium"
                    >
                        Reset to AI Recommendation
                    </button>
                )}
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Summary, Insights, Alerts */}
                <div className="space-y-6">
                    {/* Natural Language Summary */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Executive Summary
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                            {insightData.summary}
                        </p>
                    </div>

                    {/* Insights List */}
                    {insightData.insights && insightData.insights.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Analytical Trends & Spikes
                            </h3>
                            <ul className="space-y-2.5">
                                {insightData.insights.map((insight, idx) => {
                                    // Extract words to find potential columns for linking
                                    const colMatch = dataset.schema.columns.find(c => insight.includes(`"${c.name}"`) || insight.includes(`'${c.name}'`) || insight.toLowerCase().includes(c.name.toLowerCase()));
                                    return (
                                        <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-600 dark:text-slate-300">
                                            <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 leading-snug">
                                                <span>{insight}</span>
                                                {colMatch && (
                                                    <button
                                                        onClick={() => handleExploreColumn(colMatch.name, "insight")}
                                                        className="inline-flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-2"
                                                    >
                                                        Plot trend 📊
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Quality Anomalies Alert Section */}
                    {insightData.anomalies && insightData.anomalies.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Data Quality Anomalies
                            </h3>
                            <div className="space-y-2">
                                {insightData.anomalies.map((anomaly, idx) => {
                                    const colMatch = dataset.schema.columns.find(c => anomaly.includes(`"${c.name}"`) || anomaly.includes(`'${c.name}'`) || anomaly.toLowerCase().includes(c.name.toLowerCase()));
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-start justify-between p-3 bg-amber-50/20 border border-amber-100 dark:bg-amber-950/5 dark:border-amber-950/20 rounded-xl gap-3"
                                        >
                                            <div className="flex gap-2.5 items-start text-xs text-slate-600 dark:text-slate-300 leading-snug">
                                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                                <span>{anomaly}</span>
                                            </div>
                                            {colMatch && (
                                                <button
                                                    onClick={() => handleExploreColumn(colMatch.name, "anomaly")}
                                                    className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-1 rounded hover:bg-amber-200 transition font-bold uppercase tracking-wider"
                                                >
                                                    Audit
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Suggested Live Chart Rendering */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-white/40 dark:bg-slate-900/20 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" /> Live Suggested Plot
                            </span>
                            <h4 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                                {activeChart.title}
                            </h4>
                        </div>
                        <div className="text-[10px] border border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full capitalize font-semibold">
                            {activeChart.type} Chart
                        </div>
                    </div>

                    {/* Chart Container Wrapper */}
                    <div className="pt-2">
                        {(() => {
                            const dataSample = dataset.rows.slice(0, 30) // Plot up to 30 rows for visual clarity
                            if (activeChart.type === "bar") {
                                return <BarChartComponent data={dataSample} config={activeChart} />
                            }
                            if (activeChart.type === "line") {
                                return <LineChartComponent data={dataSample} config={activeChart} />
                            }
                            if (activeChart.type === "area") {
                                return <AreaChartComponent data={dataSample} config={activeChart} />
                            }
                            if (activeChart.type === "pie") {
                                return <PieChartComponent data={dataSample} config={activeChart} />
                            }
                            return <BarChartComponent data={dataSample} config={activeChart} />
                        })()}
                    </div>

                    {/* Axis Legend Details */}
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground border-t pt-3 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <span><strong>X-Axis:</strong> {activeChart.xAxis}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span><strong>Y-Axis:</strong> {activeChart.yAxis}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
