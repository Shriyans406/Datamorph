import { NextRequest, NextResponse } from "next/server";
import { geminiClient } from "@/services/ai/gemini-client";
import { aiQueue } from "@/services/ai/ai-queue";
import { aiCache } from "@/services/ai/ai-cache";
import { Prompts } from "@/services/ai/prompts";
import { fallbackEngine } from "@/services/ai/fallback-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            action, // 'chart' | 'query' | 'insight'
            datasetName,
            columns,
            sampleRows,
            naturalLanguageQuery,
            profileSummary,
            columnsProfile,
        } = body;

        if (!action) {
            return NextResponse.json({ error: "Missing required parameter: action" }, { status: 400 });
        }

        // Determine specific prompts and fallback implementations based on action
        let systemPrompt = "";
        let prompt = "";
        let fallbackResult: unknown = null;

        if (action === "chart") {
            const build = Prompts.getChartRecommendationPrompt(datasetName || "Unnamed", columns || [], sampleRows || []);
            systemPrompt = build.system;
            prompt = build.prompt;
            fallbackResult = fallbackEngine.fallbackChart(columns || [], sampleRows || []);
        } else if (action === "query") {
            const build = Prompts.getQueryParserPrompt(naturalLanguageQuery || "", columns || []);
            systemPrompt = build.system;
            prompt = build.prompt;
            fallbackResult = fallbackEngine.fallbackQuery(naturalLanguageQuery || "", columns || []);
        } else if (action === "insight") {
            const build = Prompts.getInsightPrompt(datasetName || "Unnamed", profileSummary || {}, columnsProfile || []);
            systemPrompt = build.system;
            prompt = build.prompt;
            fallbackResult = fallbackEngine.fallbackInsight(datasetName || "Unnamed", profileSummary || {}, columnsProfile || []);
        } else {
            return NextResponse.json({ error: "Invalid action type requested" }, { status: 400 });
        }

        // 1. Check Cache Layer first
        const cacheKey = aiCache.computeKey(action, prompt);
        const cachedResult = await aiCache.get(cacheKey);
        if (cachedResult) {
            return NextResponse.json({ source: "cache", data: cachedResult });
        }

        // 2. Queue the execution to protect quotas
        const resultText = await aiQueue.enqueue(async () => {
            try {
                return await geminiClient.generateText(prompt, {
                    systemInstruction: systemPrompt,
                    temperature: 0.1,
                });
            } catch (err) {
                console.error("🔴 Gemini Client generation failed. Triggering rules fallback...", err);
                return null;
            }
        });

        // 3. Handle Fallback if API or Timeout occurs
        if (!resultText) {
            console.warn("⚠️ API failure. Using fallback engine output.");
            return NextResponse.json({ source: "fallback", data: fallbackResult });
        }

        // 4. Parse JSON Response
        try {
            const cleanText = geminiClient.cleanJsonResponse(resultText);
            const parsedData = JSON.parse(cleanText);

            // Store in Cache Layer — fire-and-forget, never block the response
            aiCache.set(cacheKey, parsedData).catch(() => { /* Firestore offline is fine */ });

            return NextResponse.json({ source: "api", data: parsedData });
        } catch (parseError) {
            console.error("🔴 Failed to parse Gemini response as JSON. Error details:", parseError, "Output raw text was: ", resultText);
            console.warn("⚠️ Triggering fallback output due to json parse failure.");
            return NextResponse.json({ source: "fallback", data: fallbackResult });
        }

    } catch (error) {
        console.error("🔴 API handler crashed: ", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server crash" }, { status: 500 });
    }
}
