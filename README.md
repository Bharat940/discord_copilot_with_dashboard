# Discord Copilot

A lightweight, production-ready AI agent system consisting of a **Discord Bot** and a **Web Admin Dashboard**. 

## 🚀 Overview

Discord Copilot is designed to give teams an AI assistant that is fully configurable via a web interface. The admin can define the bot's "brain" (System Instructions) and control which channels it is allowed to operate in.

### 🏗️ 3-Tier Architecture
- **Admin Dashboard**: Next.js (App Router) interface for rules and memory management.
- **Discord Bot**: Node.js agent that interprets instructions and maintains context.
- **Supabase Backend**: Unified PostgreSQL database for configuration, memory, and sync.

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| **AI Brain** | Configure tone, personality, and rules via the web. |
| **Permissions** | Fine-grained channel allow-list manager. |
| **Smart Memory** | Automatic conversation summarization every 6 messages. |
| **Theme System** | Catppuccin-themed high-vibe UI (Macchiato & Latte). |
| **Resilience** | Defensive error handling and 503/timeout protection. |

---

## 🛠️ Tech Stack

- **Web**: Next.js 16+, Tailwind CSS (v4), Supabase Auth
- **Bot**: Node.js, Discord.js, OpenAI SDK
- **AI**: Google Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL + RLS)

---

## 🏁 Quick Start

### 1. Environment Configuration
Create `.env.local` (Dashboard) and `.env` (Bot) using the provided `.env.example` templates. You will need:
- Supabase Project URL & Keys
- Discord Bot Token
- Gemini API Key

### 2. Database Setup
Run the SQL schema provided in `supabase/schema.sql` within your Supabase SQL Editor.

### 3. Running Locally
```bash
# Terminal 1: Admin Dashboard
cd admin-dashboard && npm install && npm run dev

# Terminal 2: Discord Bot
cd discord-bot && npm install && npm run dev
```

---

## Live Submission (Review Handoff)

| Requirement | Details |
|-------------|---------|
| **Admin Dashboard** | [Live URL](https://bharatdangi-admin-dashboard-discord-bot.vercel.app/) |
| **Discord Bot** | [Live URL](https://discord-copilot-with-dashboard.onrender.com/) |
| **Admin Email** | `reviewer@example.com` |
| **Admin Password** | `ReviewPass123!` |

---

## 📦 Handoff Documentation

Full details for reviewers are separated into:
- 📖 **[Admin Dashboard](./admin-dashboard/README.md)**: Features & UX Guide.
- 📖 **[Discord Bot](./discord-bot/README.md)**: Architecture & Logic Guide.

---

**Developed By**: Bharat Dangi