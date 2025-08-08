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

  const statusClass = isBookmarkApp(app)
    ? 'bookmark'
    : (isStarting ? 'starting' : isStopping ? 'stopping' : isRunning ? 'running' : hasError ? 'error' : 'stopped')

  return (
    <div
      className={`app-list-item ${isSelected ? 'selected' : ''} ${statusClass}`}
      onClick={handleClick}
    >
      <div className="app-list-item__row">
        <h3 className="app-list-item__name" title={app.name}>{app.name}</h3>
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
    </div>
  )
}
