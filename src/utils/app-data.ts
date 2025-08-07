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
    launchCommands: '',
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
 * Creates a new global configuration with default values
 */
export function createDefaultGlobalConfig(): GlobalConfig {
  return {
    version: '1.0.0',
    apps: [],
    settings: {
      theme: 'dark',
      defaultWorkingDirectory: undefined,
      maxTerminalLines: 1000,
      defaultBrowser: undefined,
      autoSave: true,
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
      config.launchCommands &&
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
