/**
 * Structured Logger Utility
 * Provides consistent logging with timestamps, levels, and context
 */

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

export interface LogContext {
    channelId?: string | undefined
    userId?: string | undefined
    guildId?: string | undefined
    messageId?: string | undefined
    [key: string]: any
}

class Logger {
    private formatTimestamp(): string {
        return new Date().toISOString()
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = this.formatTimestamp()
        const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
        return `[${timestamp}] [${level}] ${message}${contextStr}`
    }

    info(message: string, context?: LogContext): void {
        console.log(this.formatMessage(LogLevel.INFO, message, context))
    }

    warn(message: string, context?: LogContext): void {
        console.warn(this.formatMessage(LogLevel.WARN, message, context))
    }

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        const errorDetails = error instanceof Error ? { error: error.message, stack: error.stack } : { error }
        const fullContext = { ...context, ...errorDetails }
        console.error(this.formatMessage(LogLevel.ERROR, message, fullContext))
    }
}

export const logger = new Logger()
