import { AppConfig, GlobalConfig } from '../types'

export interface ExportData {
  version: string
  exportDate: string
  type: 'single-app' | 'full-config'
  data: AppConfig | GlobalConfig
}

export interface ImportResult {
  success: boolean
  message: string
  importedCount?: number
  conflicts?: string[]
}

/**
 * Export a single app configuration to JSON
 */
export function exportApp(app: AppConfig): string {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    type: 'single-app',
    data: app,
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export full configuration to JSON
 */
export function exportFullConfig(config: GlobalConfig): string {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    type: 'full-config',
    data: config,
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Parse and validate imported JSON data
 */
export function parseImportData(jsonString: string): {
  success: boolean
  data?: ExportData
  error?: string
} {
  try {
    const data = JSON.parse(jsonString)

    // Validate structure
    if (!data.version || !data.exportDate || !data.type || !data.data) {
      return {
        success: false,
        error: 'Invalid export file format. Missing required fields.',
      }
    }

    if (data.type !== 'single-app' && data.type !== 'full-config') {
      return {
        success: false,
        error: 'Invalid export type. Must be "single-app" or "full-config".',
      }
    }

    return { success: true, data }
  } catch {
    return {
      success: false,
      error: 'Invalid JSON format. Please check the file and try again.',
    }
  }
}

/**
 * Validate app configuration structure
 */
export function validateAppConfig(app: unknown): app is AppConfig {
  if (!app || typeof app !== 'object') {
    return false
  }

  const appObj = app as Record<string, unknown>

  return (
    typeof appObj.id === 'string' &&
    typeof appObj.name === 'string' &&
    typeof appObj.launchCommands === 'string' &&
    typeof appObj.workingDirectory === 'string' &&
    typeof appObj.url === 'string' &&
    Array.isArray(appObj.tags) &&
    typeof appObj.createdAt === 'string' &&
    typeof appObj.updatedAt === 'string'
  )
}

/**
 * Generate unique name for imported app to avoid conflicts
 */
export function generateUniqueName(
  originalName: string,
  existingNames: string[]
): string {
  let uniqueName = originalName
  let counter = 1

  while (existingNames.includes(uniqueName)) {
    uniqueName = `${originalName} (${counter})`
    counter++
  }

  return uniqueName
}

/**
 * Download data as JSON file
 */
export function downloadJsonFile(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Create file input for JSON import
 */
export function createFileInput(
  onFileSelected: (file: File) => void
): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.style.display = 'none'

  input.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      onFileSelected(file)
    }
  })

  document.body.appendChild(input)
  return input
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
