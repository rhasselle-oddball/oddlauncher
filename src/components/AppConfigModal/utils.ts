/**
 * Form validation utilities for App Configuration Modal
 */

import type { AppConfig } from '../../types'
import type {
  AppConfigFormData,
  AppConfigFormErrors,
  ValidationResult,
} from './types'

/**
 * Convert AppConfig to form data
 */
export function appConfigToFormData(config: AppConfig): AppConfigFormData {
  // Decide mode from existing url: file:// => file mode
  const url = config.url || ''
  const isFile = url.startsWith('file://')
  return {
    name: config.name || '',
    launchCommands: config.launchCommands || '',
    workingDirectory: config.workingDirectory || '',
    urlMode: isFile ? 'file' : 'url',
    url: isFile ? '' : url,
    filePath: isFile ? decodeURIComponent(url.replace('file://', '')) : '',
    description: '', // Not in AppConfig yet, placeholder
    environmentVariables: config.environmentVariables || {},
    autoLaunchBrowser: config.autoLaunchBrowser ?? true,
    browserDelay: config.browserDelay || 0,
    tags: config.tags || [],
  }
}

/**
 * Convert form data to AppConfig
 */
export function formDataToAppConfig(
  formData: AppConfigFormData,
  existingConfig?: AppConfig
): AppConfig {
  const now = new Date().toISOString()

  // Build the url based on mode
  let url: string | undefined
  if (formData.urlMode === 'file') {
    const path = formData.filePath.trim()
    url = path ? `file://${encodeURI(path)}` : undefined
  } else {
    url = formData.url.trim() || undefined
  }

  return {
    id: existingConfig?.id || crypto.randomUUID(),
    name: formData.name.trim(),
    launchCommands: formData.launchCommands.trim() || undefined,
    workingDirectory: formData.workingDirectory.trim() || undefined,
    url,
    environmentVariables:
      Object.keys(formData.environmentVariables).length > 0
        ? formData.environmentVariables
        : undefined,
    autoLaunchBrowser: formData.autoLaunchBrowser,
    browserDelay: formData.browserDelay > 0 ? formData.browserDelay : undefined,
    tags:
      formData.tags.filter((tag) => tag.trim()).length > 0
        ? formData.tags.filter((tag) => tag.trim()).map((tag) => tag.trim())
        : undefined,
    createdAt: existingConfig?.createdAt || now,
    updatedAt: now,
  }
}

/**
 * Create empty form data
 */
export const getEmptyFormData = (): AppConfigFormData => ({
  name: '',
  launchCommands: '',
  workingDirectory: '',
  urlMode: 'url',
  url: '',
  filePath: '',
  description: '',
  environmentVariables: {},
  autoLaunchBrowser: true,
  browserDelay: 0,
  tags: [],
})

/**
 * Validate form data
 */
export function validateFormData(
  formData: AppConfigFormData,
  isAppNameTaken?: (name: string, excludeId?: string) => boolean,
  excludeId?: string
): ValidationResult {
  const errors: AppConfigFormErrors = {}

  // Required field validation
  if (!formData.name.trim()) {
    errors.name = 'App name is required'
  } else if (formData.name.trim().length < 2) {
    errors.name = 'App name must be at least 2 characters'
  } else if (formData.name.trim().length > 50) {
    errors.name = 'App name must be 50 characters or less'
  } else if (
    isAppNameTaken &&
    isAppNameTaken(formData.name.trim(), excludeId)
  ) {
    errors.name = 'An app with this name already exists'
  }

  // Commands and URL/file are optional; enforce only length limits if present
  if (
    formData.launchCommands.trim() &&
    formData.launchCommands.trim().length > 2000
  ) {
    errors.launchCommands = 'Launch commands must be 2000 characters or less'
  }

  // Optional field validation
  if (
    formData.workingDirectory.trim() &&
    !isValidPath(formData.workingDirectory.trim())
  ) {
    errors.workingDirectory = 'Please enter a valid directory path'
  }

  if (formData.urlMode === 'url') {
    if (formData.url.trim() && !isValidUrl(formData.url.trim())) {
      errors.url =
        'Please enter a valid URL (e.g., http://localhost:3000 or https://example.com)'
    }
  } else {
    if (formData.filePath.trim() && !isValidPath(formData.filePath.trim())) {
      errors.filePath = 'Please choose a valid file path'
    }
  }

  if (formData.browserDelay < 0 || formData.browserDelay > 60) {
    errors.browserDelay = 'Browser delay must be between 0 and 60 seconds'
  }

  // Removed port validation – field no longer exists in UI

  // Validate tags
  if (formData.tags.length > 10) {
    errors.tags = 'Maximum 10 tags allowed'
  }

  for (const tag of formData.tags) {
    if (tag.length > 20) {
      errors.tags = 'Each tag must be 20 characters or less'
      break
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate if a string is a valid file path
 */
function isValidPath(path: string): boolean {
  // Basic path validation - more comprehensive validation will be done by backend
  if (!path.trim()) return false

  // Check for invalid characters (basic check)
  const invalidChars = /[<>:"|?*]/
  if (invalidChars.test(path)) return false

  return true
}

/**
 * Parse tags from a comma-separated string
 */
export function parseTagsFromString(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 10) // Limit to 10 tags
    .map((tag) => tag.substring(0, 20)) // Limit each tag to 20 characters
}

/**
 * Format tags array to comma-separated string
 */
export function formatTagsToString(tags: string[]): string {
  return tags.join(', ')
}
