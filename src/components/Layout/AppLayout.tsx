import { useState, useEffect, useCallback, ReactNode, MouseEvent as ReactMouseEvent } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import './AppLayout.css'

interface AppLayoutProps {
  sidebar: ReactNode
  mainContent: ReactNode
}

const STORAGE_KEY = 'oddlauncher-layout-state'
const DEFAULT_SIDEBAR_WIDTH = 300
const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 600

interface LayoutState {
  sidebarWidth: number
  isCollapsed: boolean
}

export function AppLayout({ sidebar, mainContent }: AppLayoutProps) {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
    isCollapsed: false,
  })
  const [isResizing, setIsResizing] = useState(false)

  // Load layout state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as LayoutState
        setLayoutState({
          sidebarWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed.sidebarWidth)),
          isCollapsed: Boolean(parsed.isCollapsed),
        })
      } catch (error) {
        console.warn('Failed to parse saved layout state:', error)
      }
    }
  }, [])

  // Save layout state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutState))
  }, [layoutState])

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX))
    setLayoutState(prev => ({
      ...prev,
      sidebarWidth: newWidth,
    }))
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  const toggleCollapse = () => {
    setLayoutState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }))
  }

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div className={`app-layout ${isResizing ? 'resizing' : ''}`}>
      <div
        className={`sidebar ${layoutState.isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: layoutState.isCollapsed ? '48px' : `${layoutState.sidebarWidth}px`,
        }}
      >
        <div className="sidebar-header">
          <button
            className="collapse-button"
            onClick={toggleCollapse}
            title={layoutState.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {layoutState.isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          {!layoutState.isCollapsed && (
            <h2 className="sidebar-title">Library</h2>
          )}
        </div>        <div className="sidebar-content">
          {!layoutState.isCollapsed && sidebar}
        </div>
      </div>

      <div
        className="resize-handle"
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar"
      />

      <div className="main-view">
        {mainContent}
      </div>
    </div>
  )
}
