/**
 * Utility functions for working with app data models
 */
import type { AppConfig, GlobalConfig } from '../types'

/**
 * Creates a new app configuration with default values
 */
export function createDefaultAppConfig(): Omit<AppConfig, 'id'> {
  return {
    name: '',
    launchCommands: undefined,
    workingDirectory: undefined,
    url: undefined,
    environmentVariables: undefined,
    autoLaunchBrowser: undefined,
    browserDelay: undefined,
    portToCheck: undefined,
    portCheckTimeout: undefined,
    tags: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Detects the user's default shell and common source files
 */
export function detectDefaultTerminalSettings() {
  // Default shell detection
  const defaultShell = (() => {
    // Try to get from environment variable
    if (typeof window !== 'undefined' && (window as any).__TAURI__) { // eslint-disable-line @typescript-eslint/no-explicit-any
      // In Tauri environment, we'll add a command to detect shell
      return 'zsh' // Default for now, will be detected by Tauri command
    }
    
    // Browser fallback - assume zsh for modern systems
    return 'zsh'
  })()

  // Default source files based on shell
  const getDefaultSourceFiles = (shell: string): string[] => {
    switch (shell) {
      case 'zsh':
        return ['~/.zshrc', '~/.zprofile']
      case 'bash':
        return ['~/.bashrc', '~/.bash_profile', '~/.profile']
      case 'fish':
        return ['~/.config/fish/config.fish']
      default:
        return ['~/.profile']
    }
  }

  return {
    defaultShell,
    useLoginShell: true,
    inheritEnvironment: true,
    defaultSourceFiles: getDefaultSourceFiles(defaultShell),
    defaultEnvironmentVariables: {} as Record<string, string>
  }
}

/**
 * Creates a new global configuration with default values
 */
export function createDefaultGlobalConfig(): GlobalConfig {
  const terminalSettings = detectDefaultTerminalSettings()
  
  return {
    version: '1.0.0',
    apps: [],
    settings: {
      theme: 'dark',
      defaultWorkingDirectory: undefined,
      maxTerminalLines: 1000,
      defaultBrowser: undefined,
      autoSave: true,
      terminal: terminalSettings,
    },
    lastModified: new Date().toISOString(),
  }
}

/**
 * Validates that an app configuration has all required fields
 */
export function validateAppConfig(
  config: Partial<AppConfig>
): config is AppConfig {
  return Boolean(
    config.id &&
      config.name &&
      // Commands and URL/file are optional
      config.createdAt &&
      config.updatedAt
  )
}

/**
 * Generates a new unique ID for an app
 */
export function generateAppId(): string {
  return crypto.randomUUID()
}

/**
 * Updates the timestamp fields for an app configuration
 */
export function updateAppTimestamps(config: AppConfig): AppConfig {
  return {
    ...config,
    updatedAt: new Date().toISOString(),
  }
}
