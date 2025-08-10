import { Play, Square, Loader, Trash2, ExternalLink } from 'lucide-react'
import type { AppConfig } from '../../types'
import { getAppType, isBookmarkApp } from '../../types'
import { useAppProcess } from '../../hooks/useProcessManager'
import { useBrowser } from '../../hooks/useBrowser'
import { useConfigManager } from '../../hooks/useConfig'
import './MainAppHeader.css'

interface MainAppHeaderProps {
  selectedApp: AppConfig | null
  onEdit?: (app: AppConfig) => void
  onDelete?: (app: AppConfig) => void
  onOpenUrl?: (app: AppConfig) => void
  onOpenDirectory?: (app: AppConfig) => void
  /** Optional shared config manager instance to avoid duplicate state */
  configManager?: ReturnType<typeof useConfigManager>
}

export function MainAppHeader({
  selectedApp,
  onEdit,
  onDelete,
  onOpenUrl,
  onOpenDirectory,
  configManager: externalManager,
}: MainAppHeaderProps) {
  // Use process management for the selected app
  const {
    isRunning,
    isStarting,
    isStopping,
    hasError,
    start,
    stop
  } = useAppProcess(selectedApp?.id || '')

  // Use browser functionality for manual URL opening
  const { openUrlInBrowser } = useBrowser()
  const internalManager = useConfigManager()
  const configManager = externalManager || internalManager

  const getStatusDisplay = () => {
    // Check if this is a bookmark app
  const isBookmark = selectedApp ? getAppType(selectedApp) === 'bookmark' : false

    if (isBookmark) {
      // Bookmark apps just show "Open" button
      return { text: 'Open', icon: <ExternalLink size={16} />, className: 'bookmark', buttonText: 'Open' }
    }

    // Process app status logic
    if (isStarting) {
      return { text: 'Starting...', icon: <Loader size={16} className="spin" />, className: 'starting', buttonText: 'Starting...' }
    }
    if (isStopping) {
      return { text: 'Stopping...', icon: <Loader size={16} className="spin" />, className: 'stopping', buttonText: 'Stopping...' }
    }
    if (isRunning) {
      return { text: 'Stop', icon: <Square size={16} />, className: 'running', buttonText: 'Stop' }
    }
    if (hasError) {
      return { text: 'Error', icon: <Square size={16} />, className: 'error', buttonText: 'Start' }
    }
    return { text: 'Start', icon: <Play size={16} />, className: 'stopped', buttonText: 'Start' }
  }

  const handleStartStopClick = async () => {
    if (!selectedApp) return

    try {
      // Check if this is a bookmark app
      if (isBookmarkApp(selectedApp)) {
        // For bookmark apps, just open the URL
        if (selectedApp.url) {
          await openUrlInBrowser(selectedApp.url)
          // Bump usage on successful open
          const now = new Date().toISOString()
          const updated = {
            ...selectedApp,
            lastUsedAt: now,
            useCount: (selectedApp.useCount || 0) + 1,
            updatedAt: now,
          }
          await configManager.updateApp(updated)
        }
        return
      }

      // Handle process apps
      if (isRunning) {
        await stop()
      } else {
        const result = await start(
          selectedApp.launchCommands || '',
          selectedApp.workingDirectory,
          selectedApp.environmentVariables,
          selectedApp.url,
          selectedApp.autoLaunchBrowser,
          selectedApp.browserDelay,
          selectedApp.portToCheck,
          selectedApp.portCheckTimeout,
          selectedApp.terminalType
        )
        // If process started successfully, bump usage
        if (result?.success) {
          const now = new Date().toISOString()
          const updated = {
            ...selectedApp,
            lastUsedAt: now,
            useCount: (selectedApp.useCount || 0) + 1,
            updatedAt: now,
          }
          await configManager.updateApp(updated)
        }
      }
    } catch (error) {
      console.error('Failed to start/stop process:', error)
    }
  }

  const handleEditClick = () => {
    if (selectedApp && onEdit) {
      onEdit(selectedApp)
    }
  }

  const handleDeleteClick = () => {
    if (selectedApp && onDelete) {
      onDelete(selectedApp)
    }
  }

  const handleOpenUrlClick = async () => {
    if (selectedApp && selectedApp.url) {
      try {
        await openUrlInBrowser(selectedApp.url)
        // Consider URL open as a usage event too
        const now = new Date().toISOString()
        const updated = {
          ...selectedApp,
          lastUsedAt: now,
          useCount: (selectedApp.useCount || 0) + 1,
          updatedAt: now,
        }
        await configManager.updateApp(updated)
      } catch (error) {
        console.error('Failed to open URL:', error)
      }
    }

    // Also call the optional callback if provided
    if (selectedApp && onOpenUrl) {
      onOpenUrl(selectedApp)
    }
  }

  const handleOpenDirectoryClick = () => {
    if (selectedApp && onOpenDirectory) {
      onOpenDirectory(selectedApp)
    }
  }

  // No app selected state
  if (!selectedApp) {
    return (
      <div className="main-app-header">
        <div className="no-app-selected">
          <h2>No App Selected</h2>
          <p>Select an app from the sidebar to view its details and controls.</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusDisplay()

  return (
    <div className="main-app-header">
      <div className="app-header-content">
        <div className="header-top-row">
          <div className="app-info-section">
            <div className="app-details">
              <div className="title-with-edit">
                <h2 className="app-title">{selectedApp.name}</h2>
                <button
                  className="edit-text-link"
                  onClick={handleEditClick}
                  title="Edit App Configuration"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="delete-button"
              onClick={handleDeleteClick}
              title="Delete App"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="app-info-section">
          <div className="app-details">
            <div className="app-meta-primary">
              {getAppType(selectedApp) !== 'bookmark' && (
                <div className="command-section">
                  <span className="meta-label">Launch Commands:</span>
                  <div className="app-command-block">
                    <pre>{selectedApp.launchCommands}</pre>
                  </div>
                </div>
              )}

              {selectedApp.url && (
                <div className="meta-item-full">
                  <span className="meta-label">URL:</span>
                  <button
                    className="app-url-full clickable"
                    onClick={handleOpenUrlClick}
                    title="Click to open in browser"
                  >
                    {selectedApp.url}
                  </button>
                </div>
              )}

              {selectedApp.workingDirectory && (
                <div className="meta-item-full">
                  <span className="meta-label">Working Directory:</span>
                  <button
                    className="app-directory-full clickable"
                    onClick={handleOpenDirectoryClick}
                    title="Click to open in file manager"
                  >
                    {selectedApp.workingDirectory}
                  </button>
                </div>
              )}

              {selectedApp.tags && selectedApp.tags.length > 0 && (
                <div className="meta-item-full">
                  <span className="meta-label">Tags:</span>
                  <div className="app-tags">
                    {selectedApp.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="app-controls-section">
          <div className="controls-row">
            {/* For bookmark-only, show a single primary Open button */}
            {selectedApp && getAppType(selectedApp) === 'bookmark' ? (
              <button
                className={`start-stop-button bookmark`}
                onClick={handleOpenUrlClick}
                disabled={!selectedApp.url}
                title="Open in browser"
              >
                <span className="button-icon"><ExternalLink size={16} /></span>
                <span className="button-text">Open</span>
              </button>
            ) : (
              <>
                {/* Process Start/Stop */}
                <button
                  className={`start-stop-button ${statusInfo.className}`}
                  onClick={handleStartStopClick}
                  disabled={isStarting || isStopping}
                >
                  <span className="button-icon">{statusInfo.icon}</span>
                  <span className="button-text">{statusInfo.buttonText}</span>
                </button>

                {/* If URL exists, show an adjacent Open button */}
                {selectedApp?.url && (
                  <button
                    className={`start-stop-button stopped`}
                    onClick={handleOpenUrlClick}
                    title="Open in browser"
                  >
                    <span className="button-icon"><ExternalLink size={16} /></span>
                    <span className="button-text">Open</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
