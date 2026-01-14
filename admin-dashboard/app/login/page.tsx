'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/app/components/ui/theme-toggle'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
            }

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
        >
            {/* Decorative gradient orbs */}
            <div
                className="absolute top-20 left-20 w-96 h-96 opacity-20 rounded-full blur-3xl float-animation"
                style={{ background: 'var(--gradient-primary)' }}
            />
            <div
                className="absolute bottom-20 right-20 w-96 h-96 opacity-20 rounded-full blur-3xl"
                style={{
                    background: 'var(--gradient-success)',
                    animationDelay: '1s'
                }}
            />

            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            <div
                className="w-full max-w-md p-8 rounded-2xl relative z-10"
                style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-medium)',
                    boxShadow: 'var(--shadow-xl)',
                }}
            >
                <div className="text-center mb-6">
                    <h1
                        className="text-3xl font-bold mb-2 gradient-text"
                    >
                        Admin Login
                    </h1>

                    <p
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Discord Copilot Dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="email"
                            className="block mb-2 text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 rounded-lg text-base transition-all duration-200 focus:scale-[1.02]"
                            style={{
                                background: 'var(--bg-input)',
                                border: '2px solid var(--border-light)',
                                color: 'var(--text-primary)',
                            }}
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="block mb-2 text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full p-3 pr-12 rounded-lg text-base transition-all duration-200 focus:scale-[1.02]"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '2px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                }}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} style={{ color: 'var(--text-tertiary)' }} />
                                ) : (
                                    <Eye size={20} style={{ color: 'var(--text-tertiary)' }} />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div
                            className="p-3 mb-4 rounded-lg border"
                            style={{
                                background: 'var(--accent-red)',
                                borderColor: 'var(--accent-red-hover)',
                                color: 'var(--accent-red-text)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-5 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                            background: loading ? 'var(--bg-tertiary)' : 'var(--gradient-primary)',
                            color: 'var(--text-inverse)',
                            border: '2px solid transparent',
                            boxShadow: loading ? 'none' : 'var(--shadow-md)',
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}
