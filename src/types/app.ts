/**
 * Core application data types for OddLauncher
 */

/**
 * Status of an application process
 */
export type AppStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error'

/**
 * Type of application
 */
export type AppType = 'process' | 'bookmark' | 'both'

/**
 * Information about an available terminal/shell
 */
export interface TerminalInfo {
  /** Unique identifier for the terminal type */
  id: string
  /** Display name for the terminal */
  name: string
  /** Executable path/command */
  executable: string
  /** Whether this terminal is available on the system */
  available: boolean
  /** Platform this terminal is associated with */
  platform: string
}

/**
 * Configuration for an individual app
 */
export interface AppConfig {
  /** Unique identifier for the app */
  id: string
  /** Display name of the app */
  name: string
  /** Shell commands to execute sequentially (one per line) - optional for bookmark apps */
  launchCommands?: string
  /** Working directory for the command (optional) */
  workingDirectory?: string
  /** URL to open in browser when app starts (optional) */
  url?: string
  /** Environment variables to set (optional) */
  environmentVariables?: Record<string, string>
  /** Auto-launch browser when app starts (default: true if url provided) */
  autoLaunchBrowser?: boolean
  /** Delay in seconds before opening browser (default: 0) */
  browserDelay?: number
  /** Port to poll for readiness before opening browser (optional) */
  portToCheck?: number
  /** Maximum time to wait for port to be ready in seconds (default: 30) */
  portCheckTimeout?: number
  /** Tags for organization and filtering (optional) */
  tags?: string[]
  /** Terminal/shell type to use for executing commands (optional) */
  terminalType?: string
  /** Explicit app type (process, bookmark, or both). If missing, inferred at runtime for back-compat */
  appType?: AppType
  /** Last time the app was used (process started or bookmark opened) */
  lastUsedAt?: string
  /** Total times the app has been used */
  useCount?: number
  /** Creation timestamp */
  createdAt: string
  /** Last modified timestamp */
  updatedAt: string
}

/**
 * Runtime information about a running app
 */
export interface AppProcess {
  /** App configuration ID */
  appId: string
  /** Process ID (if running) */
  pid?: number
  /** Current status */
  status: AppStatus
  /** Start time (if running) */
  startedAt?: string
  /** Last error message (if status is error) */
  errorMessage?: string
  /** Terminal output buffer */
  output: string[]
  /** Whether the process is detached/background */
  isBackground?: boolean
}

/**
 * Complete app state combining config and runtime info
 */
export interface AppState {
  /** App configuration */
  config: AppConfig
  /** Runtime process information */
  process?: AppProcess
}

/**
 * Global application configuration
 */
export interface GlobalConfig {
  /** Version of the config format */
  version: string
  /** Applications configuration */
  apps: AppConfig[]
  /** Global settings */
  settings: {
    /** Theme preference (currently only 'dark' supported) */
    theme: 'dark'
    /** Default working directory for new apps */
    defaultWorkingDirectory?: string
    /** Maximum lines to keep in terminal output buffer */
    maxTerminalLines: number
    /** Default browser command (optional - uses system default) */
    defaultBrowser?: string
    /** Auto-save configuration changes */
    autoSave: boolean
  }
  /** Last modified timestamp */
  lastModified: string
}

/**
 * Error types for app operations
 */
export interface AppError {
  /** Error code */
  code: string
  /** Human-readable error message */
  message: string
  /** Additional context/details */
  details?: Record<string, unknown>
  /** Timestamp when error occurred */
  timestamp: string
}

/**
 * Result type for app operations
 */
export type AppResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: AppError
    }

/**
 * Events emitted by the app system
 */
export type AppEvent =
  | { type: 'status_changed'; appId: string; status: AppStatus }
  | { type: 'output_received'; appId: string; output: string }
  | { type: 'config_updated'; appId: string; config: AppConfig }
  | { type: 'app_added'; appId: string; config: AppConfig }
  | { type: 'app_removed'; appId: string }
  | { type: 'error_occurred'; appId: string; error: AppError }

/**
 * Utility function to determine app type based on configuration
 */
export const getAppType = (app: AppConfig): AppType => {
  // Prefer explicit type if present
  if (app.appType) return app.appType

  const hasCmd = !!(app.launchCommands && app.launchCommands.trim())
  const hasUrl = !!(app.url && app.url.trim())
  if (hasCmd && hasUrl) return 'both'
  if (hasCmd) return 'process'
  return 'bookmark'
}

/**
 * Check if an app is a bookmark (URL-only) app
 */
export const isBookmarkApp = (app: AppConfig): boolean => {
  return getAppType(app) === 'bookmark'
}

/**
 * Check if an app is a process app
 */
export const isProcessApp = (app: AppConfig): boolean => {
  const t = getAppType(app)
  return t === 'process' || t === 'both'
}

/** Check if an app is of type both */
export const isBothApp = (app: AppConfig): boolean => getAppType(app) === 'both'
