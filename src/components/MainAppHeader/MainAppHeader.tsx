import { Play, Square, Loader, Edit, Trash2, ExternalLink, FolderOpen, Copy, Download, Upload } from 'lucide-react'
import type { AppConfig } from '../../types'
import { useAppProcess } from '../../hooks/useProcessManager'
import { useBrowser } from '../../hooks/useBrowser'
import { exportApp, downloadJsonFile } from '../../utils/import-export'
import './MainAppHeader.css'

interface MainAppHeaderProps {
  selectedApp: AppConfig | null
  onEdit?: (app: AppConfig) => void
  onDelete?: (app: AppConfig) => void
  onDuplicate?: (app: AppConfig) => void
  onExportApp?: (app: AppConfig) => void
  onImportApp?: () => void
  onOpenUrl?: (app: AppConfig) => void
  onOpenDirectory?: (app: AppConfig) => void
}

export function MainAppHeader({
  selectedApp,
  onEdit,
  onDelete,
  onDuplicate,
  onExportApp,
  onImportApp,
  onOpenUrl,
  onOpenDirectory,
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

  const getStatusDisplay = () => {
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
      if (isRunning) {
        await stop()
      } else {
        await start(
          selectedApp.launchCommands,
          selectedApp.workingDirectory,
          selectedApp.environmentVariables,
          selectedApp.url,
          selectedApp.autoLaunchBrowser,
          selectedApp.browserDelay,
          selectedApp.portToCheck,
          selectedApp.portCheckTimeout
        )
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

  const handleDuplicateClick = () => {
    if (selectedApp && onDuplicate) {
      onDuplicate(selectedApp)
    }
  }

  const handleExportClick = () => {
    if (selectedApp) {
      const exportData = exportApp(selectedApp)
      const filename = `${selectedApp.name.replace(/[^a-zA-Z0-9]/g, '_')}_config.json`
      downloadJsonFile(exportData, filename)

      // Also call the optional callback if provided
      if (onExportApp) {
        onExportApp(selectedApp)
      }
    }
  }

  const handleImportClick = () => {
    if (onImportApp) {
      onImportApp()
    }
  }

  const handleOpenUrlClick = async () => {
    if (selectedApp && selectedApp.url) {
      try {
        await openUrlInBrowser(selectedApp.url)
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
        <div className="app-info-section">
          <div className="app-details">
            <h2 className="app-title">{selectedApp.name}</h2>

            <div className="app-meta">
              <div className="meta-item">
                <span className="meta-label">Command:</span>
                <code className="app-command">{selectedApp.launchCommands}</code>
              </div>

              {selectedApp.workingDirectory && (
                <div className="meta-item">
                  <span className="meta-label">Directory:</span>
                  <span className="app-directory">{selectedApp.workingDirectory}</span>
                </div>
              )}

              {selectedApp.url && (
                <div className="meta-item">
                  <span className="meta-label">URL:</span>
                  <a href={selectedApp.url} className="app-url" target="_blank" rel="noopener noreferrer">
                    {selectedApp.url}
                  </a>
                </div>
              )}

              {selectedApp.tags && selectedApp.tags.length > 0 && (
                <div className="meta-item">
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
          <button
            className={`start-stop-button ${statusInfo.className}`}
            onClick={handleStartStopClick}
            disabled={isStarting || isStopping}
          >
            <span className="button-icon">{statusInfo.icon}</span>
            <span className="button-text">{statusInfo.buttonText}</span>
          </button>

          <div className="action-buttons">
            <button
              className="action-button edit"
              onClick={handleEditClick}
              title="Edit App Configuration"
            >
              <Edit size={16} />
            </button>

            <button
              className="action-button duplicate"
              onClick={handleDuplicateClick}
              title="Duplicate App"
            >
              <Copy size={16} />
            </button>

            <button
              className="action-button export"
              onClick={handleExportClick}
              title="Export App Configuration"
            >
              <Download size={16} />
            </button>

            <button
              className="action-button import"
              onClick={handleImportClick}
              title="Import App Configuration"
            >
              <Upload size={16} />
            </button>

            {selectedApp.url && (
              <button
                className="action-button open-url"
                onClick={handleOpenUrlClick}
                title="Open URL in Browser"
              >
                <ExternalLink size={16} />
              </button>
            )}

            {selectedApp.workingDirectory && (
              <button
                className="action-button open-directory"
                onClick={handleOpenDirectoryClick}
                title="Open Directory in File Manager"
              >
                <FolderOpen size={16} />
              </button>
            )}

            <button
              className="action-button delete"
              onClick={handleDeleteClick}
              title="Delete App"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
