'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        setLoading(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            style={{
                background: loading ? 'var(--bg-tertiary)' : 'var(--accent-red)',
                color: loading ? 'var(--text-secondary)' : 'var(--text-inverse)',
                border: `2px solid ${loading ? 'var(--border-medium)' : 'var(--accent-red-hover)'}`,
            }}
        >
            {loading ? (
                'Logging out...'
            ) : (
                <>
                    <LogOut size={16} />
                    Logout
                </>
            )}
        </button>
    )
}
