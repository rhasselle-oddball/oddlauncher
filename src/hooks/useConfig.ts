import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { GlobalConfig, AppConfig, AppError } from '../types'
import { createDefaultGlobalConfig } from '../utils/app-data'

/**
 * Hook for managing global configuration
 */
export function useConfig() {
  const [config, setConfig] = useState<GlobalConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  // Load configuration from backend
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Loading configuration...')
      console.log('Window object:', typeof window)
      console.log(
        'Tauri available:',
        typeof window !== 'undefined' &&
          (window as unknown as { __TAURI__?: unknown }).__TAURI__
      )
      console.log('invoke function type:', typeof invoke)

      const result = await invoke<GlobalConfig>('load_config')
      console.log('Configuration loaded:', result)
      
      // Ensure terminal settings exist for backward compatibility
      if (!result.settings.terminal) {
        console.log('Migrating config: Adding missing terminal settings')
        const { terminal: terminalSettings } = createDefaultGlobalConfig().settings
        result.settings.terminal = terminalSettings
        // Save the migrated config
        await invoke('save_config', { config: result })
      }
      
      setConfig(result)
    } catch (err) {
      console.error('Failed to load config:', err)
      setError(err as AppError)
      // Set default config if load fails
      setConfig(createDefaultGlobalConfig())
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save configuration to backend
  const saveConfig = useCallback(
    async (newConfig: GlobalConfig): Promise<boolean> => {
      try {
        setError(null)
        await invoke('save_config', { config: newConfig })
        setConfig(newConfig)
        return true
      } catch (err) {
        console.error('Failed to save config:', err)
        setError(err as AppError)
        return false
      }
    },
    []
  )

  // Update global settings
  const updateSettings = useCallback(
    async (settings: Partial<GlobalConfig['settings']>): Promise<boolean> => {
      if (!config) return false

      const newConfig: GlobalConfig = {
        ...config,
        settings: {
          ...config.settings,
          ...settings,
        },
        lastModified: new Date().toISOString(),
      }

      return await saveConfig(newConfig)
    },
    [config, saveConfig]
  )

  // Initialize by loading config
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    isLoading,
    error,
    loadConfig,
    saveConfig,
    updateSettings,
    setConfig, // Expose setConfig for direct state updates
  }
}

/**
 * Hook for managing app configurations
 */
export function useAppConfig() {
  const [isOperating, setIsOperating] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  // Add new app configuration
  const addApp = useCallback(
    async (appConfig: AppConfig): Promise<GlobalConfig | null> => {
      try {
        setIsOperating(true)
        setError(null)

        const result = await invoke<GlobalConfig>('add_app_config', {
          appConfig,
        })
        return result
      } catch (err) {
        console.error('Failed to add app:', err)
        setError(err as AppError)
        return null
      } finally {
        setIsOperating(false)
      }
    },
    []
  )

  // Update existing app configuration
  const updateApp = useCallback(
    async (appConfig: AppConfig): Promise<GlobalConfig | null> => {
      try {
        setIsOperating(true)
        setError(null)

        const result = await invoke<GlobalConfig>('update_app_config', {
          appConfig,
        })
        return result
      } catch (err) {
        console.error('Failed to update app:', err)
        setError(err as AppError)
        return null
      } finally {
        setIsOperating(false)
      }
    },
    []
  )

  // Remove app configuration
  const removeApp = useCallback(
    async (appId: string): Promise<GlobalConfig | null> => {
      try {
        setIsOperating(true)
        setError(null)

        const result = await invoke<GlobalConfig>('remove_app_config', {
          appId,
        })
        return result
      } catch (err) {
        console.error('Failed to remove app:', err)
        setError(err as AppError)
        return null
      } finally {
        setIsOperating(false)
      }
    },
    []
  )

  // Get app by ID from config
  const getAppById = useCallback(
    (config: GlobalConfig | null, appId: string): AppConfig | null => {
      if (!config) return null
      return config.apps.find((app) => app.id === appId) || null
    },
    []
  )

  // Check if app name already exists (for validation)
  const isAppNameTaken = useCallback(
    (
      config: GlobalConfig | null,
      name: string,
      excludeId?: string
    ): boolean => {
      if (!config) return false
      return config.apps.some(
        (app) => app.name === name && app.id !== excludeId
      )
    },
    []
  )

  // Duplicate an app configuration with new ID and modified name
  const duplicateApp = useCallback(
    async (
      config: GlobalConfig | null,
      appId: string
    ): Promise<GlobalConfig | null> => {
      if (!config) return null

      const originalApp = getAppById(config, appId)
      if (!originalApp) {
        setError({
          code: 'APP_NOT_FOUND_ERROR',
          message: `App with ID '${appId}' not found`,
          timestamp: new Date().toISOString(),
        })
        return null
      }

      // Create new app config with modified name and new ID
      const newApp: AppConfig = {
        ...originalApp,
        id: crypto.randomUUID(),
        name: `${originalApp.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await addApp(newApp)
    },
    [getAppById, addApp]
  )

  return {
    isOperating,
    error,
    addApp,
    updateApp,
    removeApp,
    getAppById,
    isAppNameTaken,
    duplicateApp,
  }
}

/**
 * Hook for configuration file operations (backup, restore, etc.)
 */
export function useConfigOperations() {
  const [isOperating, setIsOperating] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  // Get configuration file information
  const getConfigInfo = useCallback(async () => {
    try {
      setError(null)
      const result = await invoke<Record<string, unknown>>('get_config_info')
      return result
    } catch (err) {
      console.error('Failed to get config info:', err)
      setError(err as AppError)
      return null
    }
  }, [])

  // Create backup of current configuration
  const createBackup = useCallback(async (): Promise<string | null> => {
    try {
      setIsOperating(true)
      setError(null)

      const backupPath = await invoke<string>('backup_config')
      return backupPath
    } catch (err) {
      console.error('Failed to create backup:', err)
      setError(err as AppError)
      return null
    } finally {
      setIsOperating(false)
    }
  }, [])

  // Restore configuration from backup
  const restoreFromBackup = useCallback(
    async (backupPath: string): Promise<GlobalConfig | null> => {
      try {
        setIsOperating(true)
        setError(null)

        const result = await invoke<GlobalConfig>('restore_config', {
          backupPath,
        })
        return result
      } catch (err) {
        console.error('Failed to restore from backup:', err)
        setError(err as AppError)
        return null
      } finally {
        setIsOperating(false)
      }
    },
    []
  )

  return {
    isOperating,
    error,
    getConfigInfo,
    createBackup,
    restoreFromBackup,
  }
}

/**
 * Combined hook that provides all configuration functionality
 */
export function useConfigManager() {
  const configHook = useConfig()
  const appConfigHook = useAppConfig()
  const operationsHook = useConfigOperations()

  // Auto-save functionality
  const saveAppAndRefresh = useCallback(
    async (operation: () => Promise<GlobalConfig | null>): Promise<boolean> => {
      const result = await operation()
      if (result) {
        // The backend operation already saved the config, just update local state
        configHook.setConfig(result)
        return true
      }
      return false
    },
    [configHook]
  )

  return {
    // Global config state
    config: configHook.config,
    isLoading: configHook.isLoading,
    error: configHook.error || appConfigHook.error || operationsHook.error,

    // Global config operations
    loadConfig: configHook.loadConfig,
    saveConfig: configHook.saveConfig,
    updateSettings: configHook.updateSettings,

    // App operations with auto-refresh
    addApp: useCallback(
      async (appConfig: AppConfig) =>
        saveAppAndRefresh(() => appConfigHook.addApp(appConfig)),
      [saveAppAndRefresh, appConfigHook]
    ),
    updateApp: useCallback(
      async (appConfig: AppConfig) =>
        saveAppAndRefresh(() => appConfigHook.updateApp(appConfig)),
      [saveAppAndRefresh, appConfigHook]
    ),
    removeApp: useCallback(
      async (appId: string) =>
        saveAppAndRefresh(() => appConfigHook.removeApp(appId)),
      [saveAppAndRefresh, appConfigHook]
    ),
    duplicateApp: useCallback(
      async (appId: string) =>
        saveAppAndRefresh(() =>
          appConfigHook.duplicateApp(configHook.config, appId)
        ),
      [saveAppAndRefresh, appConfigHook, configHook.config]
    ),

    // App utilities
    getAppById: useCallback(
      (appId: string) => appConfigHook.getAppById(configHook.config, appId),
      [appConfigHook, configHook.config]
    ),
    isAppNameTaken: useCallback(
      (name: string, excludeId?: string) =>
        appConfigHook.isAppNameTaken(configHook.config, name, excludeId),
      [appConfigHook, configHook.config]
    ),

    // File operations
    getConfigInfo: operationsHook.getConfigInfo,
    createBackup: operationsHook.createBackup,
    restoreFromBackup: operationsHook.restoreFromBackup,

    // Loading states
    isOperating: appConfigHook.isOperating || operationsHook.isOperating,
  }
}
