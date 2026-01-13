import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.js'
import { logger } from './logger.js'

/**
 * Supabase Client
 * Uses service_role key to bypass RLS policies
 */
export const supabase: SupabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

/**
 * Database Types
 */
export interface SystemInstructions {
    id: number
    content: string
    updated_at: string
    singleton: boolean
}

export interface AllowedChannel {
    id: number
    channel_id: string
    channel_name: string | null
    is_enabled: boolean
    added_at: string
}

export interface ConversationState {
    id: number
    summary: string
    message_count: number
    last_updated: string
    singleton: boolean
}

/**
 * Fetch system instructions from database
 * Returns fallback instructions if database fails
 */
export async function getSystemInstructions(): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('system_instructions')
            .select('content')
            .single()

        if (error) {
            logger.warn('Failed to fetch system instructions, using fallback', { error: error.message })
            return 'You are a helpful Discord assistant.'
        }

        if (!data || !data.content || data.content.trim().length === 0) {
            logger.warn('System instructions are empty, using fallback')
            return 'You are a helpful Discord assistant.'
        }

        return data.content
    } catch (error) {
        logger.error('Unexpected error fetching system instructions', error)
        return 'You are a helpful Discord assistant.'
    }
}

/**
 * Fetch allowed channels from database
 * Returns only enabled channels
 * Returns empty array if database fails
 */
export async function getAllowedChannels(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('allowed_channels')
            .select('channel_id')
            .eq('is_enabled', true)

        if (error) {
            logger.warn('Failed to fetch allowed channels', { error: error.message })
            return []
        }

        if (!data || data.length === 0) {
            logger.info('No allowed channels configured')
            return []
        }

        return data.map(ch => ch.channel_id)
    } catch (error) {
        logger.error('Unexpected error fetching allowed channels', error)
        return []
    }
}

/**
 * Fetch conversation state from database
 * Returns null if database fails
 */
export async function getConversationState(): Promise<ConversationState | null> {
    try {
        const { data, error } = await supabase
            .from('conversation_state')
            .select('*')
            .single()

        if (error) {
            logger.warn('Failed to fetch conversation state', { error: error.message })
            return null
        }

        return data
    } catch (error) {
        logger.error('Unexpected error fetching conversation state', error)
        return null
    }
}

/**
 * Increment message count in conversation state
 * Safely increments the counter after each successful bot reply
 * Throws error to signal failure to caller
 */
export async function incrementMessageCount(): Promise<void> {
    try {
        // Get current state
        const currentState = await getConversationState()

        if (!currentState) {
            logger.error('Cannot increment message count: conversation state not found')
            throw new Error('Conversation state not found')
        }

        // Increment count
        const newCount = currentState.message_count + 1

        // Update database
        const { error } = await supabase
            .from('conversation_state')
            .update({ message_count: newCount })
            .eq('singleton', true)

        if (error) {
            logger.error('Failed to increment message count', error, { currentCount: currentState.message_count })
            throw error
        }

        logger.info('Message count incremented', { newCount })
    } catch (error) {
        logger.error('Unexpected error incrementing message count', error)
        throw error
    }
}

/**
 * Update conversation summary and reset message count
 * Called after generating a new summary (every 6 messages)
 * Throws error to signal failure to caller
 */
export async function updateConversationSummary(newSummary: string): Promise<void> {
    try {
        if (!newSummary || newSummary.trim().length === 0) {
            logger.warn('Attempted to update with empty summary')
            throw new Error('Summary cannot be empty')
        }

        const { error } = await supabase
            .from('conversation_state')
            .update({
                summary: newSummary,
                message_count: 0
            })
            .eq('singleton', true)

        if (error) {
            logger.error('Failed to update conversation summary', error, { summaryLength: newSummary.length })
            throw error
        }

        logger.info('Conversation summary updated and message count reset', { summaryLength: newSummary.length })
    } catch (error) {
        logger.error('Unexpected error updating conversation summary', error)
        throw error
    }
}
