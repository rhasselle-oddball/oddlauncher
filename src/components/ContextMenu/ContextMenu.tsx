import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Edit, Copy, Play, Square, ExternalLink, Trash2 } from 'lucide-react'
import { AppConfig } from '../../types/app'
import './ContextMenu.css'

interface ContextMenuProps {
  app: AppConfig
  x: number
  y: number
  isVisible: boolean
  isRunning: boolean
  onClose: () => void
  onEdit: () => void
  onDuplicate: () => void
  onStartStop: () => void
  onOpenUrl?: () => void
  onDelete: () => void
}

export function ContextMenu({
  app,
  x,
  y,
  isVisible,
  isRunning,
  onClose,
  onEdit,
  onDuplicate,
  onStartStop,
  onOpenUrl,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y })

  useEffect(() => {
    if (!isVisible || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // Adjust horizontal position if menu would go off-screen
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10
    }

    // Adjust vertical position if menu would go off-screen
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY })
  }, [x, y, isVisible])

  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const hasUrl = Boolean(app.url)
  const hasCommands = Boolean(app.launchCommands && app.launchCommands.trim())

  const contextMenuContent = (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Edit */}
      <button className="context-menu-item" onClick={onEdit}>
        <Edit size={14} />
        <span>Edit</span>
        <span className="context-menu-shortcut">Ctrl+E</span>
      </button>

      {/* Duplicate */}
      <button className="context-menu-item" onClick={onDuplicate}>
        <Copy size={14} />
        <span>Duplicate</span>
        <span className="context-menu-shortcut">Ctrl+D</span>
      </button>

      <div className="context-menu-separator" />

      {/* Start/Stop - only for apps with commands */}
      {hasCommands && (
        <button className="context-menu-item" onClick={onStartStop}>
          {isRunning ? <Square size={14} /> : <Play size={14} />}
          <span>{isRunning ? 'Stop' : 'Start'}</span>
          <span className="context-menu-shortcut">Space</span>
        </button>
      )}

      {/* Open URL - only for apps with URL */}
      {hasUrl && onOpenUrl && (
        <button className="context-menu-item" onClick={onOpenUrl}>
          <ExternalLink size={14} />
          <span>Open URL</span>
        </button>
      )}

      {/* Separator before delete if we have actions above */}
      {(hasCommands || hasUrl) && <div className="context-menu-separator" />}

      {/* Delete */}
      <button className="context-menu-item context-menu-item--danger" onClick={onDelete}>
        <Trash2 size={14} />
        <span>Delete</span>
        <span className="context-menu-shortcut">Del</span>
      </button>
    </div>
  )

  // Render at document root to avoid z-index stacking context issues
  return createPortal(contextMenuContent, document.body)
}
