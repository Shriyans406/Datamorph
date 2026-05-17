import crypto from "crypto";

export interface GeminiOptions {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
}

export class GeminiClient {
    private apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || "";
        if (!this.apiKey) {
            console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in your environment variables.");
        }
    }

    /**
     * Sends a request to Gemini with built-in retry and timeout capabilities
     */
    async generateText(
        prompt: string,
        options: GeminiOptions = {},
        retries = 3,
        backoff = 1000
    ): Promise<string> {
        if (!this.apiKey) {
            throw new Error("Missing Gemini API Key");
        }

        const systemInstructionContent = options.systemInstruction
            ? {
                parts: [{ text: options.systemInstruction }],
            }
            : undefined;

        const requestBody = {
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            systemInstruction: systemInstructionContent,
            generationConfig: {
                temperature: options.temperature ?? 0.2,
                maxOutputTokens: options.maxOutputTokens ?? 2048,
                responseMimeType: "text/plain",
            },
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds strict timeout

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // If rate limited or server error, trigger retry block
                if ((response.status === 429 || response.status >= 500) && retries > 0) {
                    console.warn(`⚠️ Gemini API returned ${response.status}. Retrying in ${backoff}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                    return this.generateText(prompt, options, retries - 1, backoff * 2);
                }
                throw new Error(`Gemini API Error: HTTP ${response.status} - ${await response.text()}`);
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textContent) {
                throw new Error("Empty response received from Gemini model");
            }

            return textContent;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === "AbortError") {
                if (retries > 0) {
                    console.warn(`⏳ Request timed out. Retrying in ${backoff}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                    return this.generateText(prompt, options, retries - 1, backoff * 2);
                }
                throw new Error("Request to Gemini API timed out after 12 seconds");
            }
            if (retries > 0) {
                console.warn(`⚠️ Request failed: ${error.message}. Retrying in ${backoff}ms...`);
                await new Promise((resolve) => setTimeout(resolve, backoff));
                return this.generateText(prompt, options, retries - 1, backoff * 2);
            }
            throw error;
        }
    }

    /**
     * Cleans up AI output containing markdown backticks (e.g. ```json ... ```)
     */
    cleanJsonResponse(rawText: string): string {
        let text = rawText.trim();
        // Remove opening markdown block
        text = text.replace(/^```json\s*/i, "");
        text = text.replace(/^```\s*/, "");
        // Remove closing markdown block
        text = text.replace(/\s*```$/, "");
        return text.trim();
    }
}

export const geminiClient = new GeminiClient();
