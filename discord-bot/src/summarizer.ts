import { aiClient, MODEL_NAME } from "./aiClient.js";

/**
 * Generate a condensed summary of the conversation
 * 
 * This function takes the existing summary and recent conversation context,
 * then asks the AI to create a shorter, more focused summary.
 * 
 * @param existingSummary - The current conversation summary (can be empty)
 * @param recentContext - Recent conversation exchanges to incorporate
 * @returns Condensed summary
 */
export async function generateSummary(
    existingSummary: string,
    recentContext: string
): Promise<string> {
    // Build summarization prompt
    const systemPrompt = `You are a conversation summarizer. Your job is to create concise, informative summaries of Discord conversations.

Rules:
- Keep summaries under 200 words
- Focus on key topics, decisions, and context
- Preserve important details
- Use clear, neutral language
- If the existing summary is empty, just summarize the recent context`;

    const userPrompt = existingSummary
        ? `Existing summary: ${existingSummary}\n\nRecent conversation:\n${recentContext}\n\nCreate a condensed summary that combines both.`
        : `Recent conversation:\n${recentContext}\n\nCreate a concise summary.`;

    // Call AI to generate summary
    const response = await aiClient.chat.completions.create({
        model: MODEL_NAME,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
        throw new Error("AI returned empty summary");
    }

    return summary.trim();
}
