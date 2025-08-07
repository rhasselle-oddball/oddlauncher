import { useEffect, useCallback } from 'react'
import type { AppConfig } from '../types'

export interface KeyboardShortcuts {
  'Space': () => void        // Start/Stop selected app
  'Delete': () => void       // Delete selected app
  'Ctrl+D': () => void       // Duplicate selected app
  'Ctrl+E': () => void       // Edit selected app
  'Ctrl+N': () => void       // Add new app
  'Ctrl+I': () => void       // Import app
  'Ctrl+Shift+E': () => void // Export selected app
  'Escape': () => void       // Close modals/clear selection
}

interface UseKeyboardShortcutsProps {
  selectedApp: AppConfig | null
  onStartStop?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onEdit?: () => void
  onAddNew?: () => void
  onImport?: () => void
  onExport?: () => void
  onEscape?: () => void
  disabled?: boolean
}

export function useKeyboardShortcuts({
  selectedApp,
  onStartStop,
  onDelete,
  onDuplicate,
  onEdit,
  onAddNew,
  onImport,
  onExport,
  onEscape,
  disabled = false,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if disabled or if user is typing in an input
    if (disabled || 
        event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.isContentEditable) {
      return
    }

    const { key, ctrlKey, shiftKey, metaKey } = event
    const modifierKey = ctrlKey || metaKey // Support both Ctrl and Cmd

    // Prevent default for handled shortcuts
    let handled = false

    switch (true) {
      case key === ' ' && !modifierKey && !!selectedApp:
        // Space: Start/Stop selected app
        if (onStartStop) {
          onStartStop()
          handled = true
        }
        break

      case key === 'Delete' && !modifierKey && !!selectedApp:
        // Delete: Delete selected app
        if (onDelete) {
          onDelete()
          handled = true
        }
        break

      case key === 'd' && modifierKey && !shiftKey && !!selectedApp:
        // Ctrl+D: Duplicate selected app
        if (onDuplicate) {
          onDuplicate()
          handled = true
        }
        break

      case key === 'e' && modifierKey && !shiftKey && !!selectedApp:
        // Ctrl+E: Edit selected app
        if (onEdit) {
          onEdit()
          handled = true
        }
        break

      case key === 'n' && modifierKey && !shiftKey:
        // Ctrl+N: Add new app
        if (onAddNew) {
          onAddNew()
          handled = true
        }
        break

      case key === 'i' && modifierKey && !shiftKey:
        // Ctrl+I: Import app
        if (onImport) {
          onImport()
          handled = true
        }
        break

      case key === 'e' && modifierKey && shiftKey && !!selectedApp:
        // Ctrl+Shift+E: Export selected app
        if (onExport) {
          onExport()
          handled = true
        }
        break

      case key === 'Escape':
        // Escape: Close modals/clear selection
        if (onEscape) {
          onEscape()
          handled = true
        }
        break
    }

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, [
    disabled,
    selectedApp,
    onStartStop,
    onDelete,
    onDuplicate,
    onEdit,
    onAddNew,
    onImport,
    onExport,
    onEscape,
  ])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    shortcuts: {
      'Space': 'Start/Stop app',
      'Delete': 'Delete app',
      'Ctrl+D': 'Duplicate app',
      'Ctrl+E': 'Edit app',
      'Ctrl+N': 'Add new app',
      'Ctrl+I': 'Import app',
      'Ctrl+Shift+E': 'Export app',
      'Escape': 'Close/Cancel',
    } as const
  }
}
