'use client'

import LogoutButton from './logout-button'
import ThemeToggle from '../ui/theme-toggle'

interface DashboardHeaderProps {
    userEmail: string
}

export default function DashboardHeader({ userEmail }: DashboardHeaderProps) {
    return (
        <div
            className="p-6 md:p-8 rounded-2xl mb-6 relative overflow-hidden"
            style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--border-medium)',
                boxShadow: 'var(--shadow-lg)',
            }}
        >
            {/* Decorative gradient background */}
            <div
                className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl"
                style={{
                    background: 'var(--gradient-primary)',
                }}
            />

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1">
                    <h1
                        className="text-2xl md:text-3xl font-bold mb-2 gradient-text"
                    >
                        Discord Copilot Admin Dashboard
                    </h1>

                    <p
                        className="text-sm mb-4 flex items-center gap-2"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--accent-green)' }} />
                        Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <LogoutButton />
                </div>
            </div>
        </div>
    )
}
