'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ConversationState {
    id: string
    summary: string
    last_updated: string
    message_count: number
}

export default function MemoryViewer() {
    const [conversationState, setConversationState] = useState<ConversationState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchConversationState()

        // Auto-refresh every 10 seconds (silent mode to avoid loading flicker)
        const interval = setInterval(() => {
            fetchConversationState(true)
        }, 10000)

        return () => clearInterval(interval)
    }, [])

    const fetchConversationState = async (silent = false) => {
        if (!silent) {
            setLoading(true)
        }
        setError(null)

        try {
            const { data, error } = await supabase
                .from('conversation_state')
                .select('*')
                .single()

            if (error) throw error

            setConversationState(data)
            setLastRefresh(new Date())
        } catch (error) {
            console.error('Error fetching conversation state:', error)
            if (!silent) {
                setError('✗ Failed to load conversation memory. Please refresh the page.')
            }
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }

    const handleResetMemory = async () => {
        setResetting(true)
        setError(null)
        setResetSuccess(false)

        try {
            const { error } = await supabase
                .from('conversation_state')
                .update({
                    summary: 'No conversation history yet.',
                    message_count: 0
                })
                .eq('singleton', true)

            if (error) throw error

            await fetchConversationState()

            setResetSuccess(true)
            setShowResetModal(false)

            setTimeout(() => setResetSuccess(false), 3000)
        } catch (error) {
            console.error('Error resetting memory:', error)
            setError('✗ Failed to reset memory. Please try again.')
            setShowResetModal(false)
        } finally {
            setResetting(false)
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
                    <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: 'var(--accent-pink)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading conversation memory...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div
                className="p-6 rounded-2xl"
                style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-light)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                <h2
                    className="text-xl font-semibold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Conversation Memory
                </h2>
                <div
                    className="p-4 rounded-xl border-2"
                    style={{
                        background: 'var(--accent-red)',
                        borderColor: 'var(--accent-red-hover)',
                        color: 'var(--accent-red-text)',
                    }}
                >
                    {error}
                </div>
            </div>
        )
    }

    const hasConversation = conversationState && conversationState.summary && conversationState.summary !== 'No conversation history yet.'

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
                    style={{ background: 'var(--gradient-tertiary)' }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <h2
                            className="text-lg md:text-xl font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Conversation Memory
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={() => setShowResetModal(true)}
                            disabled={resetting}
                            className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            style={{
                                background: resetting ? 'var(--bg-tertiary)' : 'var(--accent-red)',
                                color: resetting ? 'var(--text-secondary)' : 'var(--text-inverse)',
                                border: 'none',
                            }}
                        >
                            {resetting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>Reset Memory</>
                            )}
                        </button>
                    </div>
                </div>

                {resetSuccess && (
                    <div
                        className="mb-4 p-4 rounded-xl border-2"
                        style={{
                            background: 'var(--accent-green)',
                            borderColor: 'var(--accent-green-hover)',
                            color: 'var(--text-inverse)',
                        }}
                    >
                        Memory reset successfully!
                    </div>
                )}

                <p
                    className="text-xs md:text-sm mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    The bot maintains a rolling summary of recent conversations. This memory is updated automatically every 6 messages.
                    <span className="block sm:inline sm:ml-2 text-[10px] md:text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Auto-refreshes every 10s
                    </span>
                    {lastRefresh && (
                        <span className="block sm:inline sm:ml-2 text-[10px] md:text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            • Last updated: {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                </p>

                <div className="mb-4">
                    <label
                        className="block text-xs md:text-sm font-semibold mb-2 uppercase tracking-wider"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Current Summary
                    </label>
                    <div
                        className="p-4 rounded-xl border-2 min-h-[150px] md:min-h-[200px]"
                        style={{
                            background: hasConversation ? 'var(--bg-tertiary)' : 'var(--bg-input)',
                            borderColor: hasConversation ? 'var(--accent-pink)' : 'var(--border-light)',
                        }}
                    >
                        {hasConversation ? (
                            <p
                                className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed font-mono"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {conversationState.summary}
                            </p>
                        ) : (
                            <div className="text-center py-4">
                                <p
                                    className="text-sm italic"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    No conversation history yet
                                </p>
                                <p
                                    className="text-xs mt-2"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    The bot will start building memory after the first conversation
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                    <div
                        className="p-3 md:p-4 rounded-xl"
                        style={{
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        <label
                            className="block text-[10px] md:text-xs mb-1 font-medium uppercase tracking-wider"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            Message Count
                        </label>
                        <p
                            className="text-xl md:text-2xl font-bold"
                            style={{ color: 'var(--accent-purple)' }}
                        >
                            {conversationState?.message_count || 0}
                            <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-tertiary)' }}>
                                messages total
                            </span>
                        </p>
                    </div>

                    <div
                        className="p-3 md:p-4 rounded-xl"
                        style={{
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        <label
                            className="block text-[10px] md:text-xs mb-1 font-medium uppercase tracking-wider"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            Last Updated
                        </label>
                        <p
                            className="text-[10px] sm:text-xs md:text-base font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                            title={conversationState?.last_updated ? new Date(conversationState.last_updated).toLocaleString() : 'Never'}
                        >
                            {conversationState?.last_updated
                                ? new Date(conversationState.last_updated).toLocaleString()
                                : 'Never'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showResetModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={() => !resetting && setShowResetModal(false)}
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
                            <span className="text-2xl">⚠️</span> Reset Conversation Memory?
                        </h3>
                        <p
                            className="text-sm mb-6 leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            This will permanently clear the conversation summary and reset the message count to 0.
                            The bot will start fresh with no memory of previous conversations.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowResetModal(false)}
                                disabled={resetting}
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
                                onClick={handleResetMemory}
                                disabled={resetting}
                                className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                                style={{
                                    background: resetting ? 'var(--bg-tertiary)' : 'var(--accent-red)',
                                    color: resetting ? 'var(--text-secondary)' : 'var(--text-inverse)',
                                    border: 'none',
                                }}
                            >
                                {resetting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    <>Reset Memory</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
