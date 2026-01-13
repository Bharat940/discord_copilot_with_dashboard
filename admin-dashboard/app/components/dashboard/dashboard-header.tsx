'use client'

import LogoutButton from './logout-button'
import ThemeToggle from '../ui/theme-toggle'

interface DashboardHeaderProps {
    userEmail: string
}

export default function DashboardHeader({ userEmail }: DashboardHeaderProps) {
    return (
        <div
            className="p-4 md:p-8 rounded-2xl mb-6 relative overflow-hidden"
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

            <div className="flex flex-col md:flex-row items-start justify-between gap-4 relative z-10">
                <div className="flex-1 w-full">
                    <h1
                        className="text-xl md:text-3xl font-bold mb-1 md:mb-2 gradient-text break-words"
                    >
                        Discord Copilot Admin Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end overflow-hidden">
                    <div className="flex-1 md:hidden overflow-hidden min-w-0">
                        <p
                            className="text-[10px] sm:text-xs flex items-center gap-1.5 overflow-hidden"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <span className="inline-block min-w-[6px] h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent-green)' }} />
                            <span className="truncate flex-1 min-w-0">{userEmail}</span>
                        </p>
                    </div>
                    <ThemeToggle />
                    <LogoutButton />
                </div>
            </div>

            <p
                className="hidden md:flex text-sm mt-4 items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
            >
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--accent-green)' }} />
                Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
            </p>
        </div>
    )
}
