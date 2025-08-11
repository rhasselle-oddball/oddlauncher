/**
 * Types for App Configuration Modal Component
 */

import type { AppConfig } from '../../types'
import type { useConfigManager } from '../../hooks/useConfig'

/**
 * Form data structure for the modal
 */
export interface AppConfigFormData {
  name: string
  appType?: 'process' | 'bookmark' | 'both' // Optional to allow empty state
  launchCommands: string
  workingDirectory: string
  /** How the destination is provided */
  urlMode: 'url' | 'file'
  url: string
  /** Raw local file path when urlMode === 'file' */
  filePath: string
  description: string
  environmentVariables: Record<string, string>
  autoLaunchBrowser: boolean
  browserDelay: number
  tags: string[]
  /** Terminal/shell type to use for executing commands (optional) */
  terminalType?: string
}

/**
 * Form validation errors
 */
export interface AppConfigFormErrors {
  name?: string
  appType?: string
  launchCommands?: string
  workingDirectory?: string
  url?: string
  filePath?: string
  description?: string
  environmentVariables?: string
  autoLaunchBrowser?: string
  browserDelay?: string
  tags?: string
  terminalType?: string
}

/**
 * Modal mode - add or edit
 */
export type AppConfigModalMode = 'add' | 'edit'

/**
 * Props for the AppConfigModal component
 */
export interface AppConfigModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Mode - add new launcher or edit existing */
  mode: AppConfigModalMode
  /** App to edit (required when mode is 'edit') */
  appToEdit?: AppConfig
  /** Optional shared config manager instance to keep state in sync with sidebar */
  configManager?: ReturnType<typeof useConfigManager>
  /** Callback when modal should close */
  onClose: () => void
  /** Callback when form is submitted successfully */
  onSubmit: (appConfig: AppConfig) => Promise<boolean>
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: AppConfigFormErrors
}
