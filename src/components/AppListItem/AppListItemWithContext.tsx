import React, { useState } from 'react'
import type { AppConfig } from '../../types'
import { getAppType, isBookmarkApp } from '../../types'
import { Play, Square, ExternalLink } from 'lucide-react'
import { useAppProcess } from '../../hooks/useProcessManager'
import { useBrowser } from '../../hooks/useBrowser'
import { useConfigManager } from '../../hooks/useConfig'
import { ContextMenu } from '../ContextMenu'
import './AppListItem.css'

interface AppListItemWithContextProps {
  app: AppConfig
  isSelected: boolean
  onClick: (app: AppConfig) => void
  onEdit: (app: AppConfig) => void
  onDelete: (app: AppConfig) => void
  onDuplicate: (app: AppConfig) => void
}

export function AppListItemWithContext({
  app,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onDuplicate
}: AppListItemWithContextProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  })

  // Use process management for this app
  const { isRunning, isStarting, isStopping, hasError, start, stop } = useAppProcess(app.id)
  const { openUrlInBrowser } = useBrowser()
  const configManager = useConfigManager()

  const handleClick = () => {
    onClick(app)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
    })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleContextEdit = () => {
    handleCloseContextMenu()
    onEdit(app)
  }

  const handleContextDelete = () => {
    handleCloseContextMenu()
    onDelete(app)
  }

  const handleContextDuplicate = () => {
    handleCloseContextMenu()
    onDuplicate(app)
  }

  const handleContextStartStop = async () => {
    handleCloseContextMenu()
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
          app.portCheckTimeout,
          app.terminalType,
          app.terminal
        )
        console.log('Process started:', res)
        if (res?.success && app.url && app.autoLaunchBrowser !== false) {
          const delay = (app.browserDelay || 0) * 1000
          setTimeout(() => {
            openUrlInBrowser(app.url!)
          }, delay)
        }
      }
    } catch (error) {
      console.error('Context menu start/stop error:', error)
    }
  }

  const handleContextOpenUrl = () => {
    handleCloseContextMenu()
    if (app.url) {
      openUrlInBrowser(app.url)
    }
  }

  const statusClass = isBookmarkApp(app)
    ? 'bookmark'
    : (isStarting ? 'starting' : isStopping ? 'stopping' : isRunning ? 'running' : hasError ? 'error' : 'stopped')

  return (
    <>
      <div
        className={`app-list-item ${isSelected ? 'selected' : ''} ${statusClass}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
                        app.portCheckTimeout,
                        app.terminalType,
                        app.terminal
                      )
                      console.log('Process started:', res)
                      if (res?.success && app.url && app.autoLaunchBrowser !== false) {
                        const delay = (app.browserDelay || 0) * 1000
                        setTimeout(() => {
                          openUrlInBrowser(app.url!)
                        }, delay)
                      }
                    }
                  } catch (error) {
                    console.error('Start/stop error:', error)
                  }
                }

                return (
                  <button
                    key="terminal-action"
                    className={`row-action terminal ${isRunning ? 'running' : 'idle'}`}
                    title={`${isRunning ? 'Stop' : 'Start'} ${app.name}`}
                    onClick={onTerminalClick}
                  >
                    {isRunning ? <Square size={16} /> : <Play size={16} />}
                  </button>
                )
              })()}

            {/* Browser open (only if has URL) */}
            {(() => {
              const t = getAppType(app)
              const hasUrl = t === 'bookmark' || (t === 'both' && app.url)
              if (!hasUrl) return null

              const onBrowserClick: React.MouseEventHandler = async (e) => {
                e.stopPropagation()
                if (app.url) {
                  await openUrlInBrowser(app.url)
                  // Bump usage on successful open for bookmark apps
                  if (isBookmarkApp(app)) {
                    const now = new Date().toISOString()
                    const updated = {
                      ...app,
                      lastUsedAt: now,
                      useCount: (app.useCount || 0) + 1,
                      updatedAt: now,
                    }
                    await configManager.updateApp(updated)
                  }
                }
              }

              return (
                <button
                  key="browser-action"
                  className="row-action idle"
                  title={`Open ${app.url}`}
                  onClick={onBrowserClick}
                >
                  <ExternalLink size={16} />
                </button>
              )
            })()}
          </div>
        </div>
      </div>

      <ContextMenu
        app={app}
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.visible}
        isRunning={isRunning}
        onClose={handleCloseContextMenu}
        onEdit={handleContextEdit}
        onDuplicate={handleContextDuplicate}
        onStartStop={handleContextStartStop}
        onOpenUrl={app.url ? handleContextOpenUrl : undefined}
        onDelete={handleContextDelete}
      />
    </>
  )
}
