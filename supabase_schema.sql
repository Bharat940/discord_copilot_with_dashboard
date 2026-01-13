-- ============================================
-- Discord Copilot - Supabase Database Schema
-- ============================================
-- This schema creates the minimal tables needed for the Discord Copilot system.
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- TABLE 1: system_instructions
-- ============================================
-- Stores the current system instructions (the "brain") for the Discord bot.
-- Only one row will exist; admins update it via the dashboard.
-- Singleton pattern enforced via unique constraint.

CREATE TABLE IF NOT EXISTS system_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  singleton BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enforce singleton: only one row can exist
CREATE UNIQUE INDEX IF NOT EXISTS system_instructions_singleton_idx 
ON system_instructions (singleton);

-- Insert default system instructions
INSERT INTO system_instructions (content, updated_by) 
VALUES (
  'You are a helpful Discord assistant. Be friendly, concise, and professional.',
  NULL
)
ON CONFLICT (singleton) DO NOTHING;

COMMENT ON TABLE system_instructions IS 'Stores the AI agent system instructions (prompt) - singleton table';
COMMENT ON COLUMN system_instructions.content IS 'The system prompt that controls bot behavior';
COMMENT ON COLUMN system_instructions.updated_at IS 'Timestamp of last update (auto-updated via trigger)';
COMMENT ON COLUMN system_instructions.updated_by IS 'Admin user who made the update';
COMMENT ON COLUMN system_instructions.singleton IS 'Enforces single-row constraint';

-- ============================================
-- TABLE 2: allowed_channels
-- ============================================
-- Manages which Discord channels the bot is allowed to respond in.
-- Admins can add/remove/enable/disable channels via the dashboard.

CREATE TABLE IF NOT EXISTS allowed_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for fast lookups by enabled status
CREATE INDEX IF NOT EXISTS idx_allowed_channels_enabled 
ON allowed_channels(is_enabled) 
WHERE is_enabled = true;

-- Create index for fast lookups by channel_id
CREATE INDEX IF NOT EXISTS idx_allowed_channels_channel_id 
ON allowed_channels(channel_id);

COMMENT ON TABLE allowed_channels IS 'Discord channels where the bot can respond';
COMMENT ON COLUMN allowed_channels.channel_id IS 'Discord channel ID (snowflake)';
COMMENT ON COLUMN allowed_channels.channel_name IS 'Human-readable channel name';
COMMENT ON COLUMN allowed_channels.is_enabled IS 'Whether bot should respond in this channel';

-- ============================================
-- TABLE 3: conversation_state
-- ============================================
-- Stores the rolling conversation summary (memory).
-- Only one row will exist; updated after every 6 messages.
-- NO full chat logs are stored (per requirements).
-- Singleton pattern enforced via unique constraint.

CREATE TABLE IF NOT EXISTS conversation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT NOT NULL DEFAULT '',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  singleton BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enforce singleton: only one row can exist
CREATE UNIQUE INDEX IF NOT EXISTS conversation_state_singleton_idx 
ON conversation_state (singleton);

-- Insert default conversation state
INSERT INTO conversation_state (summary, message_count) 
VALUES (
  'No conversation history yet.',
  0
)
ON CONFLICT (singleton) DO NOTHING;

COMMENT ON TABLE conversation_state IS 'Rolling conversation summary (memory) - singleton table';
COMMENT ON COLUMN conversation_state.summary IS 'AI-generated summary of recent conversations';
COMMENT ON COLUMN conversation_state.message_count IS 'Messages since last summarization (resets to 0 after every 6 messages)';
COMMENT ON COLUMN conversation_state.last_updated IS 'Timestamp of last update (auto-updated via trigger)';
COMMENT ON COLUMN conversation_state.singleton IS 'Enforces single-row constraint';

-- ============================================
-- TRIGGERS: Auto-update timestamps
-- ============================================
-- Automatically update updated_at/last_updated on UPDATE operations
-- This prevents application bugs from breaking timestamp tracking

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for system_instructions.updated_at
CREATE TRIGGER update_system_instructions_updated_at
BEFORE UPDATE ON system_instructions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for conversation_state.last_updated
CREATE TRIGGER update_conversation_state_last_updated
BEFORE UPDATE ON conversation_state
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Ensures only authenticated admin users can access these tables.
-- NOTE: Application-level access control is enforced; only one admin account is created.
-- The service_role key (used by Discord bot) bypasses RLS entirely.

-- Enable RLS on all tables
ALTER TABLE system_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read system_instructions
CREATE POLICY "Admins can read system_instructions" 
ON system_instructions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy: Admins can update system_instructions
CREATE POLICY "Admins can update system_instructions" 
ON system_instructions 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy: Admins can manage allowed_channels (all operations)
-- Application ensures only one admin account exists
CREATE POLICY "Admins can manage allowed_channels" 
ON allowed_channels 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Policy: Admins can manage conversation_state (all operations)
-- Application ensures only one admin account exists
CREATE POLICY "Admins can manage conversation_state" 
ON conversation_state 
FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================
-- SERVICE ROLE ACCESS (for Discord Bot)
-- ============================================
-- The Discord bot will use the service_role key to bypass RLS.
-- This is intentional and secure because:
-- 1. The bot needs to read config without admin authentication
-- 2. The service_role key is stored securely in environment variables
-- 3. The bot only reads data and updates conversation_state; admins control writes via dashboard

-- No additional policies needed - service_role bypasses RLS by default

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema was created correctly:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('system_instructions', 'allowed_channels', 'conversation_state');

-- Check default data exists
-- SELECT * FROM system_instructions;
-- SELECT * FROM conversation_state;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('system_instructions', 'allowed_channels', 'conversation_state');

-- Verify singleton constraints
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename IN ('system_instructions', 'conversation_state') 
-- AND indexname LIKE '%singleton%';

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table IN ('system_instructions', 'conversation_state');
