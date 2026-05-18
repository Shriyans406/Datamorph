"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, User, Database, Loader2, BarChart2 } from "lucide-react"
import { executeQuery, StructuredQuery } from "@/lib/query-executor"
import { BarChartComponent } from "@/components/visualizations/charts/bar-chart"
import { LineChartComponent } from "@/components/visualizations/charts/line-chart"
import { AreaChartComponent } from "@/components/visualizations/charts/area-chart"
import { PieChartComponent } from "@/components/visualizations/charts/pie-chart"

interface Props {
    dataset: any;
}

interface Message {
    id: string;
    role: "user" | "system";
    content: string;
    loading?: boolean;
    chartData?: {
        rows: any[];
        config: any;
        query: StructuredQuery;
    };
}

export function NLQueryEngine({ dataset }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "system",
            content: `Hello! I'm your AI data assistant. Ask me anything about **${dataset.metadata.name}**. For example: "Show top 5 columns by value" or "Trend of X over time".`
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        setInput("");

        const newMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: newMsgId, role: "user", content: userText }]);
        setIsTyping(true);

        try {
            // 1. Parse NL to Structured Query
            const colNames = dataset.schema.columns.map((c: any) => c.name);
            const queryRes = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "query",
                    naturalLanguageQuery: userText,
                    columns: colNames
                })
            });

            if (!queryRes.ok) throw new Error("Failed to parse query");
            const parsedQuery = (await queryRes.json()).data as StructuredQuery;

            // 2. Execute Query Locally
            const resultRows = executeQuery(dataset.rows, parsedQuery);

            if (resultRows.length === 0) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: "system",
                    content: "The query executed successfully, but returned 0 rows matching your criteria."
                }]);
                return;
            }

            // 3. Auto-Select Visualization
            const chartRes = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "chart",
                    datasetName: "Query Result",
                    columns: Object.keys(resultRows[0]),
                    sampleRows: resultRows.slice(0, 10)
                })
            });

            if (!chartRes.ok) throw new Error("Failed to suggest chart");
            const chartConfig = (await chartRes.json()).data;

            // 4. Update UI
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "system",
                content: `Here is the result for your query. I processed ${dataset.rows.length} rows and found ${resultRows.length} matching records.`,
                chartData: {
                    rows: resultRows,
                    config: chartConfig,
                    query: parsedQuery
                }
            }]);

        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "system",
                content: `⚠️ Sorry, I encountered an error: ${error.message}`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderChart = (chartData: NonNullable<Message['chartData']>) => {
        const { type } = chartData.config;
        const limitRows = chartData.rows.slice(0, 100); // safety limit for rendering

        return (
            <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm">{chartData.config.title}</h4>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                        {type} Chart
                    </span>
                </div>
                <div className="pt-2">
                    {type === "bar" && <BarChartComponent data={limitRows} config={chartData.config} />}
                    {type === "line" && <LineChartComponent data={limitRows} config={chartData.config} />}
                    {type === "area" && <AreaChartComponent data={limitRows} config={chartData.config} />}
                    {type === "pie" && <PieChartComponent data={limitRows} config={chartData.config} />}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[600px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Natural Language Query Engine</h2>
                        <p className="text-xs text-muted-foreground">Ask conversational questions to filter, group, and visualize data instantly</p>
                    </div>
                </div>
            </div>

            {/* Chat History */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "system" && (
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        )}

                        <div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            <div className={`p-4 rounded-2xl text-sm ${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-bl-none text-slate-700 dark:text-slate-300 shadow-sm"}`}>
                                {msg.content}
                            </div>

                            {msg.chartData && renderChart(msg.chartData)}
                        </div>

                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            <span className="text-sm text-slate-500">AI is executing query...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="e.g. 'Show top 5 regions by total revenue'..."
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
