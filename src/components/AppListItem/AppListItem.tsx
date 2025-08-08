import type { AppConfig } from '../../types'
import { getAppType, isBookmarkApp } from '../../types'
import { TerminalSquare, Link2 } from 'lucide-react'
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
          <div className="app-list-item__name-row">
            <span className="app-type-icon" title={getAppType(app)}>
              {(() => {
                const t = getAppType(app)
                if (t === 'bookmark') return <Link2 size={12} />
                if (t === 'process') return <TerminalSquare size={12} />
                return (
                  <span className="both-icons">
                    <TerminalSquare size={12} />
                    <Link2 size={12} />
                  </span>
                )
              })()}
            </span>
            <h3 className="app-list-item__name" title={app.name}>{app.name}</h3>
          </div>
          <div className={`app-list-item__status status-${statusInfo.className}`} title={statusInfo.text}>
            <div className="status-icon"></div>
          </div>
        </div>
        <div className="app-list-item__details">
          <div className="app-list-item__meta" title={app.url || app.workingDirectory || ''}>
            {app.url ? (new URL(app.url).host || app.url) : (app.workingDirectory ? app.workingDirectory.replace(/^.*\//, '') : '')}
          </div>
        </div>
      </div>
    </div>
  )
}
