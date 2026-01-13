import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Assembles AI context for chat completion API
 * 
 * Context order (strict):
 * 1. System instructions
 * 2. Conversation summary (if present)
 * 3. Current user message
 * 
 * @param systemInstructions - The bot's system instructions
 * @param conversationSummary - Optional conversation summary (can be null/empty)
 * @param userMessage - The current user message
 * @returns Array of messages compatible with OpenAI chat completions API
 */
export function assembleContext(
    systemInstructions: string,
    conversationSummary: string | null,
    userMessage: string
): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: systemInstructions,
        },
    ];

    // Add conversation summary if present
    if (conversationSummary && conversationSummary.trim().length > 0) {
        messages.push({
            role: "user",
            content: `Previous conversation context: ${conversationSummary}`,
        });
    }

    // Add current user message
    messages.push({
        role: "user",
        content: userMessage,
    });

    return messages;
}

// Example usage:
// const messages = assembleContext(
//   "You are a helpful Discord bot assistant.",
//   "User asked about weather. Bot explained it's sunny.",
//   "What about tomorrow?"
// );
//
// Result:
// [
//   { role: "system", content: "You are a helpful Discord bot assistant." },
//   { role: "user", content: "Previous conversation context: User asked about weather. Bot explained it's sunny." },
//   { role: "user", content: "What about tomorrow?" }
// ]
