/**
 * Core application data types for Oddbox
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
 * Configuration for an individual app
 */
export interface AppConfig {
  /** Unique identifier for the app */
  id: string
  /** Display name of the app */
  name: string
  /** Shell commands to execute sequentially (one per line) */
  launchCommands: string
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
