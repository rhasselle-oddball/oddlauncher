/**
 * Enhanced debug logging that captures and displays debug information
 * in the browser console with better formatting
 */

interface DebugLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
  data?: unknown
}

class DebugLogger {
  private logs: DebugLog[] = []
  private maxLogs = 1000

  private addLog(
    level: DebugLog['level'],
    source: string,
    message: string,
    data?: unknown
  ) {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    }

    this.logs.push(log)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with better formatting
    const timestamp = new Date().toLocaleTimeString()
    const prefix = `[${timestamp}] [${source.toUpperCase()}]`

    switch (level) {
      case 'error':
        console.error(`${prefix} ❌`, message, data || '')
        break
      case 'warn':
        console.warn(`${prefix} ⚠️`, message, data || '')
        break
      case 'info':
        console.info(`${prefix} ℹ️`, message, data || '')
        break
      case 'debug':
        console.debug(`${prefix} 🔍`, message, data || '')
        break
    }
  }

  info(source: string, message: string, data?: unknown) {
    this.addLog('info', source, message, data)
  }

  warn(source: string, message: string, data?: unknown) {
    this.addLog('warn', source, message, data)
  }

  error(source: string, message: string, data?: unknown) {
    this.addLog('error', source, message, data)
  }

  debug(source: string, message: string, data?: unknown) {
    this.addLog('debug', source, message, data)
  }

  getLogs(): DebugLog[] {
    return [...this.logs]
  }

  getLogsForSource(source: string): DebugLog[] {
    return this.logs.filter((log) => log.source === source)
  }

  clearLogs() {
    this.logs = []
    console.clear()
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Create a global instance
export const debugLogger = new DebugLogger()

// For development, make it available globally
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).debugLogger = debugLogger
}
