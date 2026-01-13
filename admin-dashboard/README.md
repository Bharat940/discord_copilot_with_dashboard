# Discord Copilot - Admin Dashboard

A modern, high-vibe control center for managing your AI agent. Featuring a polished Catppuccin-themed UI and seamless Supabase integration.

## 🎨 Design System: Catppuccin
The dashboard implements the **Catppuccin** color palette for a professional, low-strain aesthetic:
- **Macchiato Mode (Dark)**: High-contrast soft pastels.
- **Latte Mode (Light)**: Warm, readable soft pastels.

---

## 🛠️ Admin Features

### 1. System Instructions Editor
- Real-time character counter.
- Pulse indicator for unsaved changes.
- High-visibility feedback for safe configuration updates.

### 2. Channel Allow-list Manager
- Securely add Discord Channel IDs (Validation included).
- Enable/Disable/Remove channels to control bot accessibility instantly.

### 3. Memory Viewer & Control
- Silent auto-refresh (10s) to monitor agent context.
- Conversation summary metadata (Message counts, timestamps).
- One-click memory reset with confirmation safety.

---

## ⚙️ Setup & Tech Stack

### Prerequisites
- Node.js 20+
- Supabase Project with `schema.sql` applied.

### Environment variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

### Installation
```bash
npm install
npm run dev
```

---

## 🔐 Security & Auth
- **Supabase Auth**: Secure email/password login.
- **Row Level Security (RLS)**: Public access is disabled; only authenticated admins can read or modify configuration.