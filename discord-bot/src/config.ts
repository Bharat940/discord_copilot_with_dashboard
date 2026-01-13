import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Bot Configuration
 * Validates and exports all required environment variables
 */

// Discord Configuration
const discordToken = process.env.DISCORD_BOT_TOKEN
if (!discordToken) {
    console.error('❌ Missing DISCORD_BOT_TOKEN in .env file')
    process.exit(1)
}
export const DISCORD_BOT_TOKEN: string = discordToken

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file')
    console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

export const SUPABASE_URL: string = supabaseUrl
export const SUPABASE_SERVICE_ROLE_KEY: string = supabaseKey

// Bot behavior constants
export const BOT_CONFIG = {
    // Log level for debugging
    logLevel: process.env.LOG_LEVEL || 'info',

    // Bot status message
    statusMessage: 'Configured and ready',
} as const

console.log('✓ Configuration loaded successfully')
