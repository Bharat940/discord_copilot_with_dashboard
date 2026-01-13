'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AllowedChannel {
    id: string
    channel_id: string
    channel_name: string | null
    is_enabled: boolean
    added_at: string
}

export default function ChannelManager() {
    const [channels, setChannels] = useState<AllowedChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [newChannelId, setNewChannelId] = useState('')
    const [newChannelName, setNewChannelName] = useState('')
    const [adding, setAdding] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [showRemoveModal, setShowRemoveModal] = useState(false)
    const [channelToRemove, setChannelToRemove] = useState<string | null>(null)
    const [removing, setRemoving] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchChannels()
    }, [])

    const fetchChannels = async () => {
        setLoading(true)
        setFeedback(null)

        try {
            const { data, error } = await supabase
                .from('allowed_channels')
                .select('*')
                .order('added_at', { ascending: false })

            if (error) throw error

            setChannels(data || [])
        } catch (error) {
            console.error('Error fetching channels:', error)
            setFeedback({
                type: 'error',
                message: '✗ Failed to load channels. Please refresh the page.'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAddChannel = async () => {
        if (!newChannelId.trim()) {
            setFeedback({
                type: 'error',
                message: '✗ Channel ID is required.'
            })
            return
        }

        if (!/^\d{18,19}$/.test(newChannelId.trim())) {
            setFeedback({
                type: 'error',
                message: '✗ Invalid channel ID. Must be 18-19 digits (Discord snowflake format).'
            })
            return
        }

        setAdding(true)
        setFeedback(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('allowed_channels')
                .insert({
                    channel_id: newChannelId.trim(),
                    channel_name: newChannelName.trim() || null,
                    is_enabled: true,
                    added_by: user?.id || null
                })
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This channel ID already exists.')
                }
                throw error
            }

            setChannels([data, ...channels])
            setNewChannelId('')
            setNewChannelName('')
            setFeedback({
                type: 'success',
                message: '✓ Channel added successfully!'
            })

            setTimeout(() => setFeedback(null), 3000)
        } catch (error: any) {
            console.error('Error adding channel:', error)
            setFeedback({
                type: 'error',
                message: `✗ ${error.message || 'Failed to add channel. Please try again.'}`
            })
        } finally {
            setAdding(false)
        }
    }

    const handleToggleEnabled = async (channelId: string, currentStatus: boolean) => {
        setFeedback(null)

        try {
            const { error } = await supabase
                .from('allowed_channels')
                .update({ is_enabled: !currentStatus })
                .eq('id', channelId)

            if (error) throw error

            setChannels(channels.map(ch =>
                ch.id === channelId ? { ...ch, is_enabled: !currentStatus } : ch
            ))

            setFeedback({
                type: 'success',
                message: `✓ Channel ${!currentStatus ? 'enabled' : 'disabled'} successfully!`
            })

            setTimeout(() => setFeedback(null), 3000)
        } catch (error) {
            console.error('Error toggling channel:', error)
            setFeedback({
                type: 'error',
                message: '✗ Failed to update channel. Please try again.'
            })
        }
    }

    const openRemoveModal = (channelId: string) => {
        setChannelToRemove(channelId)
        setShowRemoveModal(true)
    }

    const handleRemoveChannel = async () => {
        if (!channelToRemove) return

        setRemoving(true)
        setFeedback(null)

        try {
            const { error } = await supabase
                .from('allowed_channels')
                .delete()
                .eq('id', channelToRemove)

            if (error) throw error

            setChannels(channels.filter(ch => ch.id !== channelToRemove))

            setFeedback({
                type: 'success',
                message: '✓ Channel removed successfully!'
            })

            setTimeout(() => setFeedback(null), 3000)
            setShowRemoveModal(false)
            setChannelToRemove(null)
        } catch (error) {
            console.error('Error removing channel:', error)
            setFeedback({
                type: 'error',
                message: '✗ Failed to remove channel. Please try again.'
            })
            setShowRemoveModal(false)
            setChannelToRemove(null)
        } finally {
            setRemoving(false)
        }
    }

    if (loading) {
        return (
            <div
                className="p-6 rounded-2xl"
                style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-light)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: 'var(--accent-blue)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading channels...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                className="p-4 md:p-6 rounded-2xl relative overflow-hidden"
                style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-light)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                {/* Decorative accent */}
                <div
                    className="absolute top-0 left-0 w-full h-1 opacity-60"
                    style={{ background: 'var(--gradient-success)' }}
                />

                <div className="flex items-center gap-2 mb-2">
                    <h2
                        className="text-lg md:text-xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Discord Channel Allow-list
                    </h2>
                </div>

                <p
                    className="text-xs md:text-sm mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Add Discord channel IDs where the bot can respond (Right-click a channel in Discord → Copy Channel ID). The bot will only respond in enabled channels or when mentioned.
                </p>

                {/* Add Channel Form */}
                <div
                    className="mb-6 p-4 md:p-5 rounded-xl"
                    style={{
                        background: 'var(--bg-tertiary)',
                        border: '2px solid var(--border-light)',
                    }}
                >
                    <h3
                        className="text-sm font-semibold mb-3 flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <span className="text-lg">➕</span> Add New Channel
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="w-full">
                            <label
                                htmlFor="channel-id"
                                className="block text-[10px] md:text-xs mb-1 font-medium"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Channel ID <span style={{ color: 'var(--accent-red-text)' }}>*</span>
                            </label>
                            <input
                                id="channel-id"
                                type="text"
                                value={newChannelId}
                                onChange={(e) => setNewChannelId(e.target.value)}
                                disabled={adding}
                                className="w-full p-2.5 md:p-3 rounded-lg text-xs md:text-sm transition-all duration-200 focus:scale-[1.02]"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '2px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                }}
                                placeholder="123456789012345678"
                            />
                        </div>

                        <div className="w-full">
                            <label
                                htmlFor="channel-name"
                                className="block text-[10px] md:text-xs mb-1 font-medium"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Channel Name (optional)
                            </label>
                            <input
                                id="channel-name"
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                disabled={adding}
                                className="w-full p-2.5 md:p-3 rounded-lg text-xs md:text-sm transition-all duration-200 focus:scale-[1.02]"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '2px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                }}
                                placeholder="general"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddChannel}
                        disabled={adding || !newChannelId.trim()}
                        className="w-full sm:w-auto px-6 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        style={{
                            background: (adding || !newChannelId.trim()) ? 'var(--bg-tertiary)' : 'var(--gradient-success)',
                            color: (adding || !newChannelId.trim()) ? 'var(--text-secondary)' : 'var(--text-inverse)',
                            border: 'none',
                        }}
                    >
                        {adding ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>Add Channel</>
                        )}
                    </button>
                </div>

                {/* Feedback Messages */}
                {feedback && (
                    <div
                        className="p-3 md:p-4 mb-4 rounded-xl border-2"
                        style={{
                            background: feedback.type === 'success'
                                ? 'var(--accent-green)'
                                : 'var(--accent-red)',
                            borderColor: feedback.type === 'success'
                                ? 'var(--accent-green-hover)'
                                : 'var(--accent-red-hover)',
                            color: 'var(--text-inverse)',
                        }}
                    >
                        <p className="text-xs md:text-sm font-medium">
                            {feedback.message}
                        </p>
                    </div>
                )}

                {/* Channels List */}
                {channels.length === 0 ? (
                    <div
                        className="text-center py-8 md:py-12 rounded-xl"
                        style={{
                            background: 'var(--bg-tertiary)',
                            border: '2px dashed var(--border-medium)',
                        }}
                    >
                        <p className="text-base md:text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>No channels configured yet</p>
                        <p className="text-xs md:text-sm" style={{ color: 'var(--text-tertiary)' }}>Add a channel above to get started</p>
                        <p className="text-[10px] md:text-xs mt-3 px-4" style={{ color: 'var(--text-tertiary)' }}>
                            Example: 123456789012345678
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p
                            className="text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-full inline-block"
                            style={{
                                background: 'var(--accent-purple)',
                                color: 'var(--text-inverse)',
                            }}
                        >
                            {channels.length} channel{channels.length !== 1 ? 's' : ''} configured
                        </p>
                        {channels.map((channel) => (
                            <div
                                key={channel.id}
                                className="p-3 md:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:scale-[1.01]"
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '2px solid var(--border-light)',
                                }}
                            >
                                <div className="flex-1 w-full overflow-hidden">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <code
                                            className="text-[10px] md:text-sm font-mono px-2 md:px-3 py-0.5 md:py-1 rounded-lg break-all"
                                            style={{
                                                background: 'var(--bg-input)',
                                                color: 'var(--accent-blue-text)',
                                                border: '1px solid var(--border-light)',
                                            }}
                                        >
                                            {channel.channel_id}
                                        </code>
                                        {channel.channel_name && (
                                            <span
                                                className="text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-none"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                #{channel.channel_name}
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="text-[10px] md:text-xs mt-1"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        Added {new Date(channel.added_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 md:gap-3 justify-end">
                                    <button
                                        onClick={() => handleToggleEnabled(channel.id, channel.is_enabled)}
                                        className="flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all duration-200 hover:scale-105"
                                        style={{
                                            background: channel.is_enabled ? 'var(--accent-green)' : 'var(--bg-hover)',
                                            color: channel.is_enabled ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                            border: `2px solid ${channel.is_enabled ? 'var(--accent-green-hover)' : 'var(--border-medium)'}`,
                                        }}
                                    >
                                        {channel.is_enabled ? 'Enabled' : 'Disabled'}
                                    </button>

                                    <button
                                        onClick={() => openRemoveModal(channel.id)}
                                        className="flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all duration-200 hover:scale-105"
                                        style={{
                                            background: 'var(--accent-red)',
                                            color: 'var(--text-inverse)',
                                            border: '2px solid var(--accent-red-hover)',
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showRemoveModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={() => !removing && setShowRemoveModal(false)}
                >
                    <div
                        className="rounded-2xl p-6 max-w-md w-full mx-4 relative overflow-hidden"
                        style={{
                            background: 'var(--bg-card)',
                            border: '2px solid var(--accent-red)',
                            boxShadow: 'var(--shadow-xl)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative accent */}
                        <div
                            className="absolute top-0 left-0 w-full h-1"
                            style={{ background: 'var(--gradient-danger)' }}
                        />

                        <h3
                            className="text-xl font-bold mb-4 flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <span className="text-2xl">⚠️</span> Remove Channel?
                        </h3>
                        <p
                            className="text-sm mb-6 leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            This will remove the channel from the allow-list. The bot will stop responding in this channel.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                disabled={removing}
                                className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-primary)',
                                    border: '2px solid var(--border-medium)',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveChannel}
                                disabled={removing}
                                className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                                style={{
                                    background: removing ? 'var(--bg-tertiary)' : 'var(--accent-red)',
                                    color: removing ? 'var(--text-secondary)' : 'var(--text-inverse)',
                                    border: 'none',
                                }}
                            >
                                {removing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Removing...
                                    </>
                                ) : (
                                    <>Remove Channel</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
