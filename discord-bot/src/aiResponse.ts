import { aiClient, MODEL_NAME } from "./aiClient.js";
import { assembleContext } from "./contextAssembler.js";

/**
 * Generate AI response using OpenAI SDK (configured for Gemini)
 * 
 * @param systemInstructions - The bot's system instructions
 * @param conversationSummary - Optional conversation summary
 * @param userMessage - The user's message
 * @returns AI-generated response text
 * @throws Error if AI call fails
 */
export async function generateAIResponse(
    systemInstructions: string,
    conversationSummary: string | null,
    userMessage: string
): Promise<string> {
    // Assemble context in correct order
    const messages = assembleContext(
        systemInstructions,
        conversationSummary,
        userMessage
    );

    // Call AI API (no streaming, no tools)
    const response = await aiClient.chat.completions.create({
        model: MODEL_NAME,
        messages: messages,
    });

    // Extract response text
    const aiMessage = response.choices[0]?.message?.content;

    if (!aiMessage) {
        throw new Error("AI returned empty response");
    }

    return aiMessage.trim();
}
