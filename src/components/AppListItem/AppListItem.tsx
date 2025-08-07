import type { AppConfig, AppStatus } from '../../types'
import './AppListItem.css'

interface AppListItemProps {
  app: AppConfig
  status?: AppStatus
  isSelected: boolean
  onClick: (app: AppConfig) => void
}

export function AppListItem({ app, status = 'stopped', isSelected, onClick }: AppListItemProps) {
  const handleClick = () => {
    onClick(app)
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'running':
        return { text: 'Running', icon: '', className: 'running' }
      case 'starting':
        return { text: 'Starting', icon: '', className: 'starting' }
      case 'stopping':
        return { text: 'Stopping', icon: '', className: 'stopping' }
      case 'error':
        return { text: 'Error', icon: '', className: 'error' }
      default:
        return { text: 'Stopped', icon: '', className: 'stopped' }
    }
  }

  const statusInfo = getStatusDisplay()

  return (
    <div
      className={`app-list-item ${isSelected ? 'selected' : ''} ${statusInfo.className}`}
      onClick={handleClick}
    >
      <div className="app-list-item__thumbnail">
        {app.thumbnailPath ? (
          <img src={app.thumbnailPath} alt={`${app.name} thumbnail`} />
        ) : (
          <div className="app-list-item__placeholder-thumbnail">
            <span className="app-list-item__placeholder-icon">📱</span>
          </div>
        )}
      </div>

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
