/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useRef, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { AppProcess, AppStatus, AppError } from '../types'
import { debugLogger } from '../utils/debug-logger'

export interface ProcessResult {
  success: boolean
  message: string
  pid?: number
  error?: string
}

export interface ProcessEvent {
  appId: string
  type?: 'stdout' | 'stderr'
  content?: string
  error?: string
  exitCode?: number
  pid?: number
  startedAt?: string
  timestamp: string
  url?: string
  reason?: string
}

export interface ProcessManagerAPI {
  processes: Record<string, AppProcess>
  isLoading: boolean
  error: AppError | null
  startProcess: (
    appId: string,
    launchCommands?: string,
    workingDirectory?: string,
    environmentVariables?: Record<string, string>,
    url?: string,
    autoLaunchBrowser?: boolean,
    browserDelay?: number,
    portToCheck?: number,
    portCheckTimeout?: number,
    terminalType?: string,
    terminalSettings?: {
      shell?: string
      useLoginShell?: boolean
      additionalSourceFiles?: string[]
      environmentVariables?: Record<string, string>
      inheritGlobalSettings?: boolean
    }
  ) => Promise<ProcessResult>
  stopProcess: (appId: string) => Promise<ProcessResult>
  getProcessStatus: (appId: string) => Promise<AppProcess | null>
  getAllProcesses: () => Promise<Record<string, AppProcess>>
  killAllProcesses: () => Promise<ProcessResult>
  clearProcessOutput: (appId: string) => void
}

export const ProcessManagerContext = createContext<ProcessManagerAPI | undefined>(undefined)

export function ProcessManagerProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<Record<string, AppProcess>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const eventListeners = useRef<(() => void)[]>([])

  const getAllProcesses = useCallback(async () => {
    try {
      setError(null)
      const result = await invoke<Record<string, AppProcess>>('get_all_process_status')
      setProcesses((prev) => {
        const merged: Record<string, AppProcess> = { ...prev }
        for (const [id, proc] of Object.entries(result)) {
          const existing = prev[id]
          merged[id] = {
            ...proc,
            // Preserve any buffered output
            output: existing?.output ?? [],
          }
        }
        return merged
      })
      return result
    } catch (err) {
      console.error('Failed to get all processes:', err)
      setError(err as AppError)
      return {}
    }
  }, [])

  const getProcessStatus = useCallback(async (appId: string) => {
    try {
      setError(null)
      const result = await invoke<AppProcess | null>('get_process_status', { appId })

      if (result) {
        setProcesses((prev) => ({
          ...prev,
          [appId]: {
            ...result,
            // Preserve any buffered output
            output: prev[appId]?.output ?? [],
          },
        }))
      } else {
        setProcesses((prev) => {
          const updated = { ...prev }
          delete updated[appId]
          return updated
        })
      }

      return result
    } catch (err) {
      console.error(`Failed to get process status for ${appId}:`, err)
      setError(err as AppError)
      return null
    }
  }, [])

  const startProcess = useCallback(async (
    appId: string,
    launchCommands?: string,
    workingDirectory?: string,
    environmentVariables?: Record<string, string>,
    url?: string,
    autoLaunchBrowser?: boolean,
    browserDelay?: number,
    portToCheck?: number,
    portCheckTimeout?: number,
    terminalType?: string,
    terminalSettings?: {
      shell?: string
      useLoginShell?: boolean
      additionalSourceFiles?: string[]
      environmentVariables?: Record<string, string>
      inheritGlobalSettings?: boolean
    }
  ): Promise<ProcessResult> => {
    try {
      debugLogger.info('ProcessManager', `Starting process for app: ${appId}`, {
        launchCommands,
        workingDirectory,
        environmentVariables,
        url,
        autoLaunchBrowser,
        browserDelay,
        portToCheck,
        portCheckTimeout,
        terminalType,
        terminalSettings,
      })

      setIsLoading(true)
      setError(null)

      setProcesses((prev) => ({
        ...prev,
        [appId]: {
          appId,
          pid: undefined,
          status: 'starting' as AppStatus,
          startedAt: undefined,
          errorMessage: undefined,
          // Preserve any existing buffered output (important for very fast commands)
          output: prev[appId]?.output ?? [],
          isBackground: false,
        },
      }))

      const result = await invoke<ProcessResult>('start_app_process', {
        appId,
        launchCommands,
        workingDirectory,
        environmentVariables,
        url,
        autoLaunchBrowser,
        browserDelay,
        portToCheck,
        portCheckTimeout,
        terminalType,
        terminalSettings,
      })

      debugLogger.info('ProcessManager', `Process start result for ${appId}:`, result)

  if (!result.success || !result.pid) {
        debugLogger.error('ProcessManager', `Failed to start process for ${appId}`, result)
        setProcesses((prev) => {
          const updated = { ...prev }
          delete updated[appId]
          return updated
        })
      }

      return result
    } catch (err) {
      debugLogger.error('ProcessManager', `Exception starting process for ${appId}`, err)
      console.error(`Failed to start process for ${appId}:`, err)
      setError(err as AppError)

      setProcesses((prev) => {
        const updated = { ...prev }
        delete updated[appId]
        return updated
      })

      return { success: false, message: `Failed to start process: ${err}`, error: String(err) }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopProcess = useCallback(async (appId: string): Promise<ProcessResult> => {
    try {
      setIsLoading(true)
      setError(null)

      setProcesses((prev) => {
        if (prev[appId]) {
          return { ...prev, [appId]: { ...prev[appId], status: 'stopping' as AppStatus } }
        }
        return prev
      })

      const result = await invoke<ProcessResult>('stop_app_process', { appId })

      if (result.success) {
        // Mark as stopped but keep logs visible
        setProcesses((prev) => {
          const current = prev[appId]
          if (!current) return prev
          return { ...prev, [appId]: { ...current, status: 'stopped' as AppStatus, pid: undefined } }
        })
      } else {
        setProcesses((prev) => {
          if (prev[appId]) {
            return {
              ...prev,
              [appId]: { ...prev[appId], status: 'error' as AppStatus, errorMessage: result.error || result.message },
            }
          }
          return prev
        })
      }

      return result
    } catch (err) {
      console.error(`Failed to stop process for ${appId}:`, err)
      setError(err as AppError)

      setProcesses((prev) => {
        if (prev[appId]) {
          return { ...prev, [appId]: { ...prev[appId], status: 'error' as AppStatus, errorMessage: String(err) } }
        }
        return prev
      })

      return { success: false, message: `Failed to stop process: ${err}`, error: String(err) }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearProcessOutput = useCallback((appId: string) => {
    setProcesses((prev) => {
      const currentProcess = prev[appId]
      if (!currentProcess) return prev
      return { ...prev, [appId]: { ...currentProcess, output: [] } }
    })
  }, [])

  const killAllProcesses = useCallback(async (): Promise<ProcessResult> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await invoke<ProcessResult>('kill_all_processes')
      if (result.success) {
        setProcesses({})
      }
      return result
    } catch (err) {
      console.error('Failed to kill all processes:', err)
      setError(err as AppError)
      return { success: false, message: `Failed to kill all processes: ${err}`, error: String(err) }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const toSafeTime = (ts?: string): string => {
      if (!ts) return new Date().toLocaleTimeString()
      // Trim RFC3339 fractional seconds to milliseconds for JS Date
      const trimmed = ts.replace(/\.(\d{3})\d+(Z|[+-]\d{2}:?\d{2})$/, '.$1$2')
      const d = new Date(trimmed)
      if (isNaN(d.getTime())) return new Date().toLocaleTimeString()
      return d.toLocaleTimeString()
    }
    const setup = async () => {
      try {
        console.log('[ProcessManager] Setting up event listeners')
        const unlistenStarted = await listen<ProcessEvent>('process-started', (event) => {
          const { appId, pid, startedAt } = event.payload
          if (!isMounted) return
          console.log('[ProcessManager] process-started', { appId, pid, startedAt })
          setProcesses((prev) => {
            const existing = prev[appId]
            return {
              ...prev,
              [appId]: {
                appId,
                pid: pid,
                status: 'running' as AppStatus,
                startedAt: startedAt,
                errorMessage: undefined,
                // Keep any output that may have arrived early
                output: existing?.output ?? [],
                isBackground: false,
              },
            }
          })
        })

        const unlistenStopped = await listen<ProcessEvent>('process-stopped', (event) => {
          const { appId } = event.payload
          if (!isMounted) return
          console.log('[ProcessManager] process-stopped', { appId })
          setProcesses((prev) => {
            const current = prev[appId]
            if (!current) return prev
            return { ...prev, [appId]: { ...current, status: 'stopped', pid: undefined } }
          })
        })

        const unlistenExit = await listen<ProcessEvent>('process-exit', (event) => {
          const { appId, exitCode } = event.payload
          if (!isMounted) return
          console.log('[ProcessManager] process-exit', { appId, exitCode })
          setProcesses((prev) => {
            const current = prev[appId]
            const exitMsg = `[${new Date().toLocaleTimeString()}] Process exited with code ${exitCode ?? 'unknown'}`
            if (!current) {
              return {
                ...prev,
                [appId]: {
                  appId,
                  pid: undefined,
                  status: 'stopped',
                  startedAt: undefined,
                  errorMessage: undefined,
                  output: [exitMsg],
                  isBackground: false,
                },
              }
            }
            const output = [...current.output, exitMsg].slice(-1000)
            return { ...prev, [appId]: { ...current, status: 'stopped', pid: undefined, output } }
          })
        })

        const unlistenError = await listen<ProcessEvent>('process-error', (event) => {
          const { appId, error } = event.payload
          if (!isMounted) return
          console.log('[ProcessManager] process-error', { appId, error })
          debugLogger.error('ProcessManager', `Process error for ${appId}:`, error)
          setProcesses((prev) => ({
            ...prev,
            [appId]: {
              appId,
              pid: undefined,
              status: 'error' as AppStatus,
              startedAt: undefined,
              errorMessage: error,
              output: [],
              isBackground: false,
            },
          }))
        })

        const unlistenOutput = await listen<ProcessEvent>('process-output', (event) => {
          const { appId, type, content, timestamp } = event.payload
          if (!appId || !content || !isMounted) return
          // Only log first few chars to avoid spam
          console.log('[ProcessManager] process-output', { appId, type, ts: timestamp, sample: content.slice(0, 80) })

          const typePrefix = type === 'stderr' ? '[ERR] ' : ''
          const formattedLine = `[${toSafeTime(timestamp)}] ${typePrefix}${content}`

          setProcesses((prev) => {
            const currentProcess = prev[appId]
            const maxLines = 1000
            if (!currentProcess) {
              console.log('[ProcessManager] init process entry on first output', { appId })
              // Initialize entry if output arrives before 'process-started'
              return {
                ...prev,
                [appId]: {
                  appId,
                  pid: undefined,
                  status: 'running' as AppStatus,
                  startedAt: undefined,
                  errorMessage: undefined,
                  output: [formattedLine].slice(-maxLines),
                  isBackground: false,
                },
              }
            }
            const lenBefore = currentProcess.output.length
            const newOutput = [...currentProcess.output, formattedLine]
            const trimmedOutput = newOutput.length > maxLines ? newOutput.slice(-maxLines) : newOutput
            const next = { ...prev, [appId]: { ...currentProcess, output: trimmedOutput } }
            console.log('[ProcessManager] output appended', { appId, lenBefore, lenAfter: trimmedOutput.length })
            return next
          })
        })

        const unlistenBrowserLaunched = await listen<ProcessEvent>('browser-launched', (event) => {
          const { appId, url, timestamp } = event.payload
          if (!appId || !url || !isMounted) return
          const browserMessage = `[${toSafeTime(timestamp)}] ✅ Browser launched: ${url}`
          setProcesses((prev) => {
            const currentProcess = prev[appId]
            if (!currentProcess) return prev
            const newOutput = [...currentProcess.output, browserMessage]
            const maxLines = 1000
            const trimmedOutput = newOutput.length > maxLines ? newOutput.slice(-maxLines) : newOutput
            return { ...prev, [appId]: { ...currentProcess, output: trimmedOutput } }
          })
        })

        const unlistenBrowserLaunchFailed = await listen<ProcessEvent>('browser-launch-failed', (event) => {
          const { appId, url, reason, timestamp } = event.payload
          if (!appId || !isMounted) return
          const browserMessage = `[${toSafeTime(timestamp)}] ❌ Browser launch failed: ${reason}${url ? ` (${url})` : ''}`
          setProcesses((prev) => {
            const currentProcess = prev[appId]
            if (!currentProcess) return prev
            const newOutput = [...currentProcess.output, browserMessage]
            const maxLines = 1000
            const trimmedOutput = newOutput.length > maxLines ? newOutput.slice(-maxLines) : newOutput
            return { ...prev, [appId]: { ...currentProcess, output: trimmedOutput } }
          })
        })

  eventListeners.current = [
          unlistenStarted,
          unlistenStopped,
          unlistenExit,
          unlistenError,
          unlistenOutput,
          unlistenBrowserLaunched,
          unlistenBrowserLaunchFailed,
        ]
      } catch (err) {
  console.error('Failed to setup process event listeners:', err)
        setError(err as AppError)
      }
    }

    setup()
    getAllProcesses()

    return () => {
      eventListeners.current.forEach((unlisten) => unlisten())
      eventListeners.current = []
      isMounted = false
    }
  }, [getAllProcesses])

  const value: ProcessManagerAPI = {
    processes,
    isLoading,
    error,
    startProcess,
    stopProcess,
    getProcessStatus,
    getAllProcesses,
    killAllProcesses,
    clearProcessOutput,
  }

  return <ProcessManagerContext.Provider value={value}>{children}</ProcessManagerContext.Provider>
}

// Consumers should use hooks/useProcessManager.ts to access this context
