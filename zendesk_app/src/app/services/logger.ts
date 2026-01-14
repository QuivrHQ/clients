import * as Sentry from '@sentry/react'

type LogLevel = 'error' | 'warning' | 'info' | 'debug'

interface LogContext {
  [key: string]: any
}

interface LoggerConfig {
  enableSentry: boolean
  enableConsole: boolean
  environment: string
}

class Logger {
  private config: LoggerConfig

  constructor() {
    this.config = {
      enableSentry: !!import.meta.env.VITE_SENTRY_DSN,
      enableConsole: import.meta.env.VITE_ENVIRONMENT === 'development',
      environment: import.meta.env.VITE_ENVIRONMENT || 'development'
    }
  }

  /**
   * Log an error with automatic Sentry capture and console output
   * @param error - Error object or message
   * @param context - Additional context to attach to the error
   */
  error(error: Error | string, context?: LogContext): void {
    this.log('error', error, context)
  }

  /**
   * Log a warning
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context?: LogContext): void {
    this.log('warning', message, context)
  }

  /**
   * Log an info message
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log a debug message (only in development)
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context?: LogContext): void {
    if (this.config.environment === 'development') {
      this.log('debug', message, context)
    }
  }

  private log(level: LogLevel, errorOrMessage: Error | string, context?: LogContext): void {
    const isError = errorOrMessage instanceof Error
    const message = isError ? errorOrMessage.message : errorOrMessage

    // Console logging
    if (this.config.enableConsole) {
      const consoleMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log
      consoleMethod(`[${level.toUpperCase()}]`, message, context || '')
      if (isError) {
        console.error((errorOrMessage as Error).stack)
      }
    }

    // Sentry logging
    if (this.config.enableSentry) {
      const sentryLevel = this.mapLogLevelToSentryLevel(level)

      if (isError) {
        Sentry.captureException(errorOrMessage, {
          level: sentryLevel,
          extra: context
        })
      } else {
        Sentry.captureMessage(message, {
          level: sentryLevel,
          extra: context
        })
      }
    }
  }

  private mapLogLevelToSentryLevel(level: LogLevel): Sentry.SeverityLevel {
    const mapping: Record<LogLevel, Sentry.SeverityLevel> = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      debug: 'debug'
    }
    return mapping[level]
  }
}

// Export singleton instance
export const logger = new Logger()
