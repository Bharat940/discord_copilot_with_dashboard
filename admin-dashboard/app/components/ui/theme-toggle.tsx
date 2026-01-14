'use client'

import { useTheme } from '../providers/theme-provider'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
                background: 'var(--bg-tertiary)',
                border: '2px solid var(--border-medium)',
                color: 'var(--text-primary)',
            }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon size={20} />
            ) : (
                <Sun size={20} />
            )}
        </button>
    )
}
