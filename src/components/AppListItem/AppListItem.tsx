import React from 'react'
import type { AppConfig } from '../../types'
import { getAppType, isBookmarkApp } from '../../types'
import { TerminalSquare, ExternalLink } from 'lucide-react'
import { useAppProcess } from '../../hooks/useProcessManager'
import { useBrowser } from '../../hooks/useBrowser'
import { useConfigManager } from '../../hooks/useConfig'
import './AppListItem.css'

interface AppListItemProps {
  app: AppConfig
  isSelected: boolean
  onClick: (app: AppConfig) => void
}

export function AppListItem({ app, isSelected, onClick }: AppListItemProps) {
  // Use process management for this app
  const { isRunning, isStarting, isStopping, hasError, start, stop } = useAppProcess(app.id)
  const { openUrlInBrowser } = useBrowser()
  const configManager = useConfigManager()

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
            <h3 className="app-list-item__name" title={app.name}>{app.name}</h3>
          </div>
          <div className="app-list-item__row-actions">
            {/* Terminal start/stop toggle (only if has commands) */}
            {(() => {
              const t = getAppType(app)
              const canRun = t === 'process' || t === 'both'
              if (!canRun) return null
              const onTerminalClick: React.MouseEventHandler = async (e) => {
                e.stopPropagation()
                try {
                  if (isRunning) {
                    await stop()
                  } else {
                    const res = await start(
                      app.launchCommands || '',
                      app.workingDirectory,
                      app.environmentVariables,
                      app.url,
                      app.autoLaunchBrowser,
                      app.browserDelay,
                      app.portToCheck,
                      app.portCheckTimeout
                    )
                    if (res?.success) {
                      const now = new Date().toISOString()
                      await configManager.updateApp({
                        ...app,
                        lastUsedAt: now,
                        useCount: (app.useCount || 0) + 1,
                        updatedAt: now,
                      })
                    }
                  }
                } catch (err) {
                  console.error('Sidebar terminal action failed', err)
                }
              }
              return (
                <button
                  className={`row-action terminal ${isRunning ? 'running' : ''}`}
                  onClick={onTerminalClick}
                  title={isRunning ? 'Stop process' : 'Start process'}
                >
                  <TerminalSquare size={16} />
                </button>
              )
            })()}

            {/* Browser open (if URL) */}
            {app.url && (
              <button
                className="row-action browser"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const ok = await openUrlInBrowser(app.url!)
                    if (ok) {
                      const now = new Date().toISOString()
                      await configManager.updateApp({
                        ...app,
                        lastUsedAt: now,
                        useCount: (app.useCount || 0) + 1,
                        updatedAt: now,
                      })
                    }
                  } catch (err) {
                    console.error('Failed to open URL from sidebar', err)
                  }
                }}
                title="Open in browser"
              >
                <ExternalLink size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="app-list-item__details">
          <div className="app-list-item__meta" title={app.url || app.workingDirectory || ''}>
            {app.url ? (new URL(app.url).host || app.url) : (app.workingDirectory ? app.workingDirectory.replace(/^.*\\\//, '') : '')}
          </div>
        </div>
      </div>
    </div>
  )
}
