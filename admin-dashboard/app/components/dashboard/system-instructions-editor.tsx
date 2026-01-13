'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SystemInstructions {
    id: string
    content: string
    updated_at: string
    updated_by: string | null
}

export default function SystemInstructionsEditor() {
    const [content, setContent] = useState('')
    const [originalContent, setOriginalContent] = useState('')
    const [updatedAt, setUpdatedAt] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchInstructions()
    }, [])

    const fetchInstructions = async () => {
        setLoading(true)
        setFeedback(null)

        try {
            const { data, error } = await supabase
                .from('system_instructions')
                .select('*')
                .single()

            if (error) throw error

            if (data) {
                setContent(data.content)
                setOriginalContent(data.content)
                setUpdatedAt(data.updated_at)
            }
        } catch (error) {
            console.error('Error fetching system instructions:', error)
            setFeedback({
                type: 'error',
                message: 'Failed to load system instructions. Please refresh the page.'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setFeedback(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('system_instructions')
                .update({
                    content: content,
                    updated_by: user?.id || null
                })
                .eq('singleton', true)
                .select()
                .single()

            if (error) throw error

            if (data) {
                setOriginalContent(data.content)
                setUpdatedAt(data.updated_at)
                setFeedback({
                    type: 'success',
                    message: '✓ System instructions saved successfully!'
                })

                setTimeout(() => setFeedback(null), 3000)
            }
        } catch (error) {
            console.error('Error saving system instructions:', error)
            setFeedback({
                type: 'error',
                message: '✗ Failed to save system instructions. Please try again.'
            })
        } finally {
            setSaving(false)
        }
    }

    const hasChanges = content !== originalContent
    const charCount = content.length

    if (loading) {
        return (
            <div
                className="p-6 rounded-2xl relative overflow-hidden"
                style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-light)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: 'var(--accent-purple)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading system instructions...</p>
                </div>
            </div>
        )
    }

    return (
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
                style={{ background: 'var(--gradient-primary)' }}
            />

            <div className="flex items-center gap-2 mb-2">
                <h2
                    className="text-lg md:text-xl font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                >
                    System Instructions
                </h2>
            </div>

            <p
                className="text-xs md:text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
            >
                These instructions control how the Discord bot behaves. Changes take effect immediately.
            </p>

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={saving}
                className="w-full min-h-[250px] md:min-h-[300px] p-4 rounded-xl text-xs md:text-sm font-mono resize-y mb-3 transition-all duration-200 focus:scale-[1.01]"
                style={{
                    background: saving ? 'var(--bg-tertiary)' : 'var(--bg-input)',
                    border: `2px solid ${saving ? 'var(--border-light)' : hasChanges ? 'var(--accent-purple)' : 'var(--border-medium)'}`,
                    color: saving ? 'var(--text-tertiary)' : 'var(--text-primary)',
                }}
                placeholder="Enter system instructions for the Discord bot..."
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <p
                        className="text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-full"
                        style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)'
                        }}
                    >
                        {charCount} characters
                    </p>
                    {updatedAt && (
                        <p
                            className="text-[10px] md:text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            Last saved: {new Date(updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            {feedback && (
                <div
                    className="p-3 md:p-4 mb-4 rounded-xl border-2 flex items-center gap-3"
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
                    <p className="text-xs md:text-sm font-medium flex-1">
                        {feedback.message}
                    </p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{
                        background: (saving || !hasChanges) ? 'var(--bg-tertiary)' : 'var(--gradient-primary)',
                        color: (saving || !hasChanges) ? 'var(--text-secondary)' : 'var(--text-inverse)',
                        border: 'none',
                        boxShadow: (saving || !hasChanges) ? 'none' : 'var(--shadow-md)',
                    }}
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>Save Changes</>
                    )}
                </button>

                {hasChanges && !saving && (
                    <span
                        className="text-xs md:text-sm font-medium flex items-center justify-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                            color: 'var(--text-inverse)',
                            background: 'var(--accent-amber)',
                        }}
                    >
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--text-inverse)' }} />
                        Unsaved changes
                    </span>
                )}
            </div>
        </div>
    )
}
