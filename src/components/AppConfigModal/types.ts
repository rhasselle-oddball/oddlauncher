/**
 * Types for App Configuration Modal Component
 */

import type { AppConfig } from '../../types'

/**
 * Form data structure for the modal
 */
export interface AppConfigFormData {
  name: string
  command: string
  workingDirectory: string
  url: string
  description: string
  environmentVariables: Record<string, string>
  autoLaunchBrowser: boolean
  browserDelay: number
  portToCheck: string
  portCheckTimeout: number
  tags: string[]
}

/**
 * Form validation errors
 */
export interface AppConfigFormErrors {
  name?: string
  command?: string
  workingDirectory?: string
  url?: string
  description?: string
  environmentVariables?: string
  autoLaunchBrowser?: string
  browserDelay?: string
  portToCheck?: string
  portCheckTimeout?: string
  tags?: string
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
  /** Mode - add new app or edit existing */
  mode: AppConfigModalMode
  /** App to edit (required when mode is 'edit') */
  appToEdit?: AppConfig
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
