import type { AppConfig } from '../../types'
import { isBookmarkApp } from '../../types'
import { useAppProcess } from '../../hooks/useProcessManager'
import './AppListItem.css'

interface AppListItemProps {
  app: AppConfig
  isSelected: boolean
  onClick: (app: AppConfig) => void
}

export function AppListItem({ app, isSelected, onClick }: AppListItemProps) {
  // Use process management for this app
  const { isRunning, isStarting, isStopping, hasError } = useAppProcess(app.id)

  const handleClick = () => {
    onClick(app)
  }

  const getStatusDisplay = () => {
    // Check if this is a bookmark app
    if (isBookmarkApp(app)) {
      return { text: 'Bookmark', icon: '', className: 'bookmark' }
    }

    // Process app status logic
    if (isStarting) {
      return { text: 'Starting', icon: '', className: 'starting' }
    }
    if (isStopping) {
      return { text: 'Stopping', icon: '', className: 'stopping' }
    }
    if (isRunning) {
      return { text: 'Running', icon: '', className: 'running' }
    }
    if (hasError) {
      return { text: 'Error', icon: '', className: 'error' }
    }
    return { text: 'Stopped', icon: '', className: 'stopped' }
  }

  const statusInfo = getStatusDisplay()

  return (
    <div
      className={`app-list-item ${isSelected ? 'selected' : ''} ${statusInfo.className}`}
      onClick={handleClick}
    >
      <div className="app-list-item__content">
        <div className="app-list-item__header">
          <h3 className="app-list-item__name">{app.name}</h3>
          <div className={`app-list-item__status status-${statusInfo.className}`}>
            <div className="status-icon"></div>
            <span className="status-text">{statusInfo.text}</span>
          </div>
        </div>

        <div className="app-list-item__details">
          {app.workingDirectory && (
            <div className="app-list-item__directory" title={app.workingDirectory}>
              {app.workingDirectory.replace(/^.*\//, '')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
