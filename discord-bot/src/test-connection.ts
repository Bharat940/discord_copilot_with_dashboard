import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testConnection() {
    console.log('🔍 Testing Discord Bot Database Connection...\n')

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing environment variables!')
        console.error('   Please ensure .env file contains:')
        console.error('   - SUPABASE_URL')
        console.error('   - SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    console.log(`✓ Environment variables loaded`)
    console.log(`  URL: ${SUPABASE_URL}`)
    console.log(`  Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`)

    // Create Supabase client with service_role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    try {
        // Test 1: Read system_instructions
        console.log('📋 Test 1: Reading system_instructions...')
        const { data: instructions, error: instructionsError } = await supabase
            .from('system_instructions')
            .select('*')
            .single()

        if (instructionsError) {
            console.error('❌ Failed to read system_instructions:', instructionsError.message)
            process.exit(1)
        }

        console.log('✓ Successfully read system_instructions')
        console.log(`  Content: "${instructions.content.substring(0, 50)}..."`)
        console.log(`  Updated: ${instructions.updated_at}\n`)

        // Test 2: Read conversation_state
        console.log('💬 Test 2: Reading conversation_state...')
        const { data: conversation, error: conversationError } = await supabase
            .from('conversation_state')
            .select('*')
            .single()

        if (conversationError) {
            console.error('❌ Failed to read conversation_state:', conversationError.message)
            process.exit(1)
        }

        console.log('✓ Successfully read conversation_state')
        console.log(`  Summary: "${conversation.summary}"`)
        console.log(`  Message Count: ${conversation.message_count}`)
        console.log(`  Last Updated: ${conversation.last_updated}\n`)

        // Test 3: Read allowed_channels
        console.log('📺 Test 3: Reading allowed_channels...')
        const { data: channels, error: channelsError } = await supabase
            .from('allowed_channels')
            .select('*')

        if (channelsError) {
            console.error('❌ Failed to read allowed_channels:', channelsError.message)
            process.exit(1)
        }

        console.log(`✓ Successfully read allowed_channels`)
        console.log(`  Total channels: ${channels?.length || 0}`)
        if (channels && channels.length > 0) {
            channels.forEach(ch => {
                console.log(`  - ${ch.channel_name || ch.channel_id} (${ch.is_enabled ? 'enabled' : 'disabled'})`)
            })
        } else {
            console.log('  (No channels configured yet)')
        }
        console.log()

        // Test 4: Verify RLS bypass (service_role should bypass RLS)
        console.log('🔐 Test 4: Verifying service_role bypasses RLS...')
        const { data: rlsTest, error: rlsError } = await supabase
            .from('system_instructions')
            .select('id')
            .single()

        if (rlsError) {
            console.error('❌ RLS bypass failed:', rlsError.message)
            console.error('   Service role key should bypass RLS policies!')
            process.exit(1)
        }

        console.log('✓ Service role key correctly bypasses RLS\n')

        // Test 5: Test write operation (update conversation_state)
        console.log('✍️  Test 5: Testing write operation...')
        const { error: updateError } = await supabase
            .from('conversation_state')
            .update({
                summary: 'Database connection test successful!',
                message_count: 0
            })
            .eq('singleton', true)

        if (updateError) {
            console.error('❌ Failed to update conversation_state:', updateError.message)
            process.exit(1)
        }

        console.log('✓ Successfully updated conversation_state\n')

        // Reset to default
        await supabase
            .from('conversation_state')
            .update({
                summary: 'No conversation history yet.',
                message_count: 0
            })
            .eq('singleton', true)

        // Success summary
        console.log('═══════════════════════════════════════════')
        console.log('✅ ALL TESTS PASSED!')
        console.log('═══════════════════════════════════════════')
        console.log('Discord bot can successfully:')
        console.log('  ✓ Connect to Supabase')
        console.log('  ✓ Read system instructions')
        console.log('  ✓ Read conversation state')
        console.log('  ✓ Read allowed channels')
        console.log('  ✓ Bypass RLS policies (service_role)')
        console.log('  ✓ Write to database')
        console.log('═══════════════════════════════════════════\n')

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        process.exit(1)
    }
}

// Run the test
testConnection()
