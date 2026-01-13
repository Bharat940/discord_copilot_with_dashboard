import OpenAI from "openai";

// AI client configuration from environment variables
const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL;
const AI_MODEL = process.env.AI_MODEL;

// Validate required configuration
if (!AI_API_KEY) {
    throw new Error("AI_API_KEY environment variable is required");
}

if (!AI_BASE_URL) {
    throw new Error("AI_BASE_URL environment variable is required");
}

if (!AI_MODEL) {
    throw new Error("AI_MODEL environment variable is required");
}

// Initialize OpenAI client with custom base URL (for Gemini compatibility)
export const aiClient = new OpenAI({
    apiKey: AI_API_KEY,
    baseURL: AI_BASE_URL,
});

// Export model name for use in API calls
export const MODEL_NAME = AI_MODEL;
