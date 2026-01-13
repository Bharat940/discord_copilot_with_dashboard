import { Client, GatewayIntentBits, Message } from 'discord.js'
import { DISCORD_BOT_TOKEN, BOT_CONFIG } from './config.js'
import { getSystemInstructions, getAllowedChannels, getConversationState, incrementMessageCount, updateConversationSummary } from './supabase.js'
import { generateAIResponse } from './aiResponse.js'
import { generateSummary } from './summarizer.js'
import { logger, type LogContext } from './logger.js'

/**
 * Discord Bot Client
 * Configured with necessary intents to read messages and mentions
 */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
})

/**
 * Constants
 */
const DISCORD_MESSAGE_LIMIT = 2000
const AI_TIMEOUT_MS = 30000 // 30 seconds
const CHANNEL_CACHE_TTL = 60000 // 1 minute

/**
 * Cache for allowed channels
 * Refreshed periodically to avoid constant database queries
 */
let allowedChannelsCache: string[] = []
let lastChannelRefresh = 0

/**
 * Refresh allowed channels cache with defensive error handling
 */
async function refreshAllowedChannels(): Promise<void> {
    const now = Date.now()
    if (now - lastChannelRefresh > CHANNEL_CACHE_TTL) {
        try {
            allowedChannelsCache = await getAllowedChannels()
            lastChannelRefresh = now
            logger.info(`Refreshed allowed channels cache`, { channelCount: allowedChannelsCache.length })
        } catch (error) {
            logger.error('Failed to refresh allowed channels cache', error, {
                fallback: 'Using cached channels',
                cacheAge: now - lastChannelRefresh
            })
            // Continue with stale cache rather than crashing
        }
    }
}

/**
 * Check if bot should respond to a message
 * Returns true if:
 * 1. Message is in an allowed channel, OR
 * 2. Bot is mentioned in the message
 */
function shouldRespond(message: Message): boolean {
    // Ignore bot's own messages
    if (message.author.bot) {
        return false
    }

    // Check if bot is mentioned
    const isMentioned = message.mentions.has(client.user!.id)

    // Check if channel is allowed
    const isInAllowedChannel = allowedChannelsCache.includes(message.channelId)

    return isMentioned || isInAllowedChannel
}

/**
 * Validate and truncate response to Discord's 2000 character limit
 */
function validateResponse(response: string): string {
    if (response.length <= DISCORD_MESSAGE_LIMIT) {
        return response
    }

    logger.warn('Response exceeds Discord limit, truncating', {
        originalLength: response.length,
        limit: DISCORD_MESSAGE_LIMIT
    })

    // Truncate and add ellipsis
    return response.substring(0, DISCORD_MESSAGE_LIMIT - 3) + '...'
}

/**
 * Wrap AI generation with timeout
 */
async function generateAIResponseWithTimeout(
    systemInstructions: string,
    conversationSummary: string | null,
    userMessage: string
): Promise<string> {
    return Promise.race([
        generateAIResponse(systemInstructions, conversationSummary, userMessage),
        new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)
        )
    ])
}

/**
 * Handle incoming messages with comprehensive error handling
 */
async function handleMessage(message: Message): Promise<void> {
    const context: LogContext = {
        channelId: message.channelId,
        userId: message.author.id,
        messageId: message.id,
        ...(message.guildId && { guildId: message.guildId })
    }

    try {
        // Refresh allowed channels cache
        await refreshAllowedChannels()

        // Check if bot should respond
        if (!shouldRespond(message)) {
            return // Silently ignore
        }

        logger.info('Processing message', {
            ...context,
            author: message.author.tag,
            contentLength: message.content.length
        })

        // Fetch configuration from Supabase with defensive error handling
        let systemInstructions: string
        let conversationState: any

        try {
            [systemInstructions, conversationState] = await Promise.all([
                getSystemInstructions(),
                getConversationState()
            ])
        } catch (configError) {
            logger.error('Failed to fetch configuration from Supabase', configError, context)
            await message.reply('⚠️ I\'m having trouble connecting to my configuration. Please try again in a moment.')
            return
        }

        // Validate system instructions
        if (!systemInstructions || systemInstructions.trim().length === 0) {
            logger.warn('System instructions are empty, using fallback', context)
            systemInstructions = 'You are a helpful Discord bot assistant.'
        }

        logger.info('Configuration loaded', {
            ...context,
            instructionsLength: systemInstructions.length,
            hasSummary: !!conversationState?.summary,
            messageCount: conversationState?.message_count || 0
        })

        // Generate AI response with timeout
        let aiResponse: string
        try {
            logger.info('Generating AI response', context)
            aiResponse = await generateAIResponseWithTimeout(
                systemInstructions,
                conversationState?.summary || null,
                message.content
            )
            logger.info('AI response generated', { ...context, responseLength: aiResponse.length })
        } catch (aiError) {
            logger.error('AI generation failed', aiError, context)
            await message.reply('⚠️ I encountered an error while processing your message. Please try again later.')
            return
        }

        // Validate and truncate response if needed
        aiResponse = validateResponse(aiResponse)

        // Send AI response to Discord with error handling
        try {
            await message.reply(aiResponse)
            logger.info('Response sent successfully', context)
        } catch (discordError) {
            logger.error('Failed to send Discord message', discordError, context)
            // Don't increment message count if we couldn't send the response
            return
        }

        // Increment message count and handle summarization (non-fatal)
        try {
            await incrementMessageCount()

            // Get updated conversation state to check if summarization is needed
            const updatedState = await getConversationState()
            const newMessageCount = updatedState?.message_count || 0

            // Trigger summarization if message count >= 6
            if (newMessageCount >= 6) {
                logger.info('Triggering summarization', { ...context, messageCount: newMessageCount })

                try {
                    // Build recent context from current exchange
                    const recentContext = `User: ${message.content}\nBot: ${aiResponse}`

                    // Generate new summary
                    const newSummary = await generateSummary(
                        updatedState?.summary || '',
                        recentContext
                    )

                    logger.info('Summary generated', { ...context, summaryLength: newSummary.length })

                    // Update database with new summary and reset count
                    await updateConversationSummary(newSummary)

                    logger.info('Summarization complete', context)
                } catch (summaryError) {
                    logger.error('Summarization failed (non-fatal)', summaryError, context)
                    // Continue even if summarization fails
                }
            }
        } catch (countError) {
            logger.error('Failed to increment message count (non-fatal)', countError, context)
            // Continue even if count increment fails
        }

    } catch (error) {
        logger.error('Unexpected error handling message', error, context)

        // Try to send error message to user
        try {
            await message.reply('⚠️ An unexpected error occurred. Please try again.')
        } catch (replyError) {
            logger.error('Failed to send error message to user', replyError, context)
        }
    }
}

/**
 * Bot Ready Event
 */
client.on('ready', () => {
    logger.info('═══════════════════════════════════════════')
    logger.info(`Bot logged in as ${client.user?.tag}`)
    logger.info('═══════════════════════════════════════════')
    logger.info(`Status: ${BOT_CONFIG.statusMessage}`)
    logger.info(`Log Level: ${BOT_CONFIG.logLevel}`)
    logger.info(`AI Timeout: ${AI_TIMEOUT_MS}ms`)
    logger.info(`Discord Message Limit: ${DISCORD_MESSAGE_LIMIT} chars`)
    logger.info('═══════════════════════════════════════════')

    // Initial channel cache refresh
    refreshAllowedChannels()
})

/**
 * Message Create Event
 */
client.on('messageCreate', handleMessage)

/**
 * Error Handler
 */
client.on('error', (error) => {
    logger.error('Discord client error', error)
})

/**
 * Start the bot
 */
export async function startBot(): Promise<void> {
    try {
        logger.info('Starting Discord bot...')
        await client.login(DISCORD_BOT_TOKEN)
    } catch (error) {
        logger.error('Failed to start bot', error)
        process.exit(1)
    }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down bot...')
    client.destroy()
    process.exit(0)
})

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down bot...')
    client.destroy()
    process.exit(0)
})
