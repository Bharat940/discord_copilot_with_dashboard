# Discord Copilot Bot

The execution layer of the Discord Copilot system. This Node.js bot handles real-time interactions, context assembly, and AI response generation.

## 🤖 Bot Capabilities

- **Smart Filtering**: Adheres strictly to the Admin's channel allow-list. Responds outside of allowed channels *only* when explicitly @mentioned.
- **Context Awareness**: Assembles a rich prompt including System Instructions, recent Conversation Summary, and the current User Message.
- **Auto-Summarization**: Automatically condenses conversation history every 6 messages to maintain a lightweight context window.
- **Failure Resilience**: Built-in protection against Gemini API 503s and 30s timeouts.

---

## 🏗️ Technical Architecture

- **Engine**: Node.js 20+ with TypeScript
- **Framework**: `discord.js` v14
- **AI Integrator**: OpenAI SDK (compatible with Google Gemini)
- **Log System**: Structured JSON logging with `LOG_LEVEL` support

---

## ⚙️ Environment Configuration

| Variable | Purpose |
|----------|---------|
| `DISCORD_BOT_TOKEN` | Auth token from Developer Portal |
| `SUPABASE_URL` | Your project endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Key allowed to bypass RLS for bot config |
| `AI_API_KEY` | Gemini API Key |
| `AI_BASE_URL` | Generativelanguage endpoint |
| `AI_MODEL` | Set to `gemini-2.5-flash` or similar |

---

## 🚀 Operations

### Getting Started
```bash
npm install
npm run dev
```

### Key Safety Rules
1. **Never Crashing**: Every external call (AI, DB, Discord) is wrapped in try-catch with graceful fallbacks.
2. **Rate Limiting**: Designed for efficient token usage via summarization.
3. **Intent-Security**: Only listens to `GuildMessages` and `MessageContent`.