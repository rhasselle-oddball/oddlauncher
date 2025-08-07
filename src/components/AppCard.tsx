import React, { useState } from 'react'
import { AppState, AppStatus } from '../types'
import DebugModal from './DebugModal'
import './AppCard.css'

interface AppCardProps {
  appState: AppState
  onStart?: (appId: string) => void
  onStop?: (appId: string) => void
  onEdit?: (appId: string) => void
  onDelete?: (appId: string) => void
}

/**
 * Steam-like app card component displaying app information and controls
 */
export const AppCard: React.FC<AppCardProps> = ({
  appState,
  onStart,
  onStop,
  onEdit,
  onDelete,
}) => {
  const { config, process } = appState
  const status: AppStatus = process?.status || 'stopped'
  const isRunning = status === 'running'
  const isStarting = status === 'starting'
  const isStopping = status === 'stopping'
  const hasError = status === 'error'
  
  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false)

  const getStatusDisplay = () => {
    switch (status) {
      case 'running':
        return { text: 'Running', icon: '🟢', className: 'status-running' }
      case 'starting':
        return { text: 'Starting...', icon: '🟡', className: 'status-starting' }
      case 'stopping':
        return { text: 'Stopping...', icon: '🟡', className: 'status-stopping' }
      case 'error':
        return { text: 'Error', icon: '🔴', className: 'status-error' }
      default:
        return { text: 'Stopped', icon: '🔴', className: 'status-stopped' }
    }
  }

  const statusInfo = getStatusDisplay()

  const handleStartStop = () => {
    if (isRunning) {
      onStop?.(config.id)
    } else if (!isStarting && !isStopping) {
      onStart?.(config.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(config.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(config.id)
  }

  return (
    <div className={`app-card ${hasError ? 'app-card--error' : ''}`}>
      {/* Content */}
      <div className="app-card__content">
        <div className="app-card__header">
          <div className="app-card__title-section">
            <h3 className="app-card__name" title={config.name}>
              {config.name}
            </h3>
            <div className={`app-card__status ${statusInfo.className}`}>
              <span className="app-card__status-icon">{statusInfo.icon}</span>
              <span className="app-card__status-text">{statusInfo.text}</span>
            </div>
          </div>
          <div className="app-card__actions">
            <button
              className="app-card__action-btn app-card__edit-btn"
              onClick={handleEdit}
              title="Edit app configuration"
              aria-label="Edit app configuration"
            >
              ⚙️
            </button>
            <button
              className="app-card__action-btn app-card__delete-btn"
              onClick={handleDelete}
              title="Delete app"
              aria-label="Delete app"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="app-card__details">
          <p className="app-card__command" title={config.command}>
            {config.command}
          </p>
          {config.workingDirectory && (
            <p className="app-card__directory" title={config.workingDirectory}>
              📁 {config.workingDirectory}
            </p>
          )}
          {config.url && (
            <p className="app-card__url" title={config.url}>
              🔗 {config.url}
            </p>
          )}
          {config.tags && config.tags.length > 0 && (
            <div className="app-card__tags">
              {config.tags.map((tag) => (
                <span key={tag} className="app-card__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {hasError && process?.errorMessage && (
          <div className="app-card__error">
            <p title={process.errorMessage}>
              ⚠️ {process.errorMessage}
            </p>
            <button
              className="app-card__debug-btn"
              onClick={(e) => {
                e.stopPropagation()
                setShowDebugModal(true)
              }}
              title="Show debug information"
            >
              🔍 Debug
            </button>
          </div>
        )}

        {/* Start/Stop Button */}
        <button
          className={`app-card__main-btn ${
            isRunning ? 'app-card__main-btn--stop' : 'app-card__main-btn--start'
          } ${isStarting || isStopping ? 'app-card__main-btn--loading' : ''}`}
          onClick={handleStartStop}
          disabled={isStarting || isStopping}
          title={isRunning ? 'Stop application' : 'Start application'}
        >
          {isStarting && '⏳ Starting...'}
          {isStopping && '⏳ Stopping...'}
          {!isStarting && !isStopping && (isRunning ? '⏹️ Stop' : '▶️ Start')}
        </button>
      </div>

      {/* Debug Modal */}
      <DebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        appName={config.name}
        command={config.command}
        workingDirectory={config.workingDirectory}
        errorMessage={process?.errorMessage}
      />
    </div>
  )
}
