import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { AppProcess, AppStatus, AppError } from '../types'

/**
 * Result type for process operations from backend
 */
export interface ProcessResult {
  success: boolean
  message: string
  pid?: number
  error?: string
}

/**
 * Process event types
 */
export interface ProcessEvent {
  appId: string
  type?: 'stdout' | 'stderr'
  content?: string
  error?: string
  exitCode?: number
  pid?: number
  startedAt?: string
  timestamp: string
}

/**
 * Hook for managing app processes
 */
export function useProcessManager() {
  const [processes, setProcesses] = useState<Record<string, AppProcess>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  // Refs to store event listeners for cleanup
  const eventListeners = useRef<(() => void)[]>([])

  // Get all process statuses
  const getAllProcesses = useCallback(async () => {
    try {
      setError(null)
      const result = await invoke<Record<string, AppProcess>>(
        'get_all_process_status'
      )
      setProcesses(result)
      return result
    } catch (err) {
      console.error('Failed to get all processes:', err)
      setError(err as AppError)
      return {}
    }
  }, [])

  // Get status for a specific process
  const getProcessStatus = useCallback(async (appId: string) => {
    try {
      setError(null)
      const result = await invoke<AppProcess | null>('get_process_status', {
        appId,
      })

      if (result) {
        setProcesses((prev) => ({
          ...prev,
          [appId]: result,
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

  // Start a process
  const startProcess = useCallback(
    async (
      appId: string,
      command: string,
      workingDirectory?: string,
      environmentVariables?: Record<string, string>
    ): Promise<ProcessResult> => {
      try {
        setIsLoading(true)
        setError(null)

        // Update status to starting
        setProcesses((prev) => ({
          ...prev,
          [appId]: {
            appId,
            pid: undefined,
            status: 'starting' as AppStatus,
            startedAt: undefined,
            errorMessage: undefined,
            output: [],
            isBackground: false,
          },
        }))

        const result = await invoke<ProcessResult>('start_app_process', {
          appId,
          command,
          workingDirectory,
          environmentVariables,
        })

        if (result.success && result.pid) {
          setProcesses((prev) => ({
            ...prev,
            [appId]: {
              appId,
              pid: result.pid,
              status: 'running' as AppStatus,
              startedAt: new Date().toISOString(),
              errorMessage: undefined,
              output: [],
              isBackground: false,
            },
          }))
        } else {
          // Remove from processes on failure
          setProcesses((prev) => {
            const updated = { ...prev }
            delete updated[appId]
            return updated
          })
        }

        return result
      } catch (err) {
        console.error(`Failed to start process for ${appId}:`, err)
        setError(err as AppError)

        // Remove from processes on error
        setProcesses((prev) => {
          const updated = { ...prev }
          delete updated[appId]
          return updated
        })

        return {
          success: false,
          message: `Failed to start process: ${err}`,
          error: String(err),
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Stop a process
  const stopProcess = useCallback(
    async (appId: string): Promise<ProcessResult> => {
      try {
        setIsLoading(true)
        setError(null)

        // Update status to stopping
        setProcesses((prev) => {
          if (prev[appId]) {
            return {
              ...prev,
              [appId]: {
                ...prev[appId],
                status: 'stopping' as AppStatus,
              },
            }
          }
          return prev
        })

        const result = await invoke<ProcessResult>('stop_app_process', {
          appId,
        })

        if (result.success) {
          // Remove from processes on successful stop
          setProcesses((prev) => {
            const updated = { ...prev }
            delete updated[appId]
            return updated
          })
        } else {
          // Update status to error if stop failed
          setProcesses((prev) => {
            if (prev[appId]) {
              return {
                ...prev,
                [appId]: {
                  ...prev[appId],
                  status: 'error' as AppStatus,
                  errorMessage: result.error || result.message,
                },
              }
            }
            return prev
          })
        }

        return result
      } catch (err) {
        console.error(`Failed to stop process for ${appId}:`, err)
        setError(err as AppError)

        // Update status to error
        setProcesses((prev) => {
          if (prev[appId]) {
            return {
              ...prev,
              [appId]: {
                ...prev[appId],
                status: 'error' as AppStatus,
                errorMessage: String(err),
              },
            }
          }
          return prev
        })

        return {
          success: false,
          message: `Failed to stop process: ${err}`,
          error: String(err),
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Clear terminal output for a specific app
  const clearProcessOutput = useCallback((appId: string) => {
    setProcesses((prev) => {
      const currentProcess = prev[appId]
      if (!currentProcess) return prev

      return {
        ...prev,
        [appId]: {
          ...currentProcess,
          output: [],
        },
      }
    })
  }, [])

  // Kill all processes
  const killAllProcesses = useCallback(async (): Promise<ProcessResult> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await invoke<ProcessResult>('kill_all_processes')

      if (result.success) {
        // Clear all processes
        setProcesses({})
      }

      return result
    } catch (err) {
      console.error('Failed to kill all processes:', err)
      setError(err as AppError)

      return {
        success: false,
        message: `Failed to kill all processes: ${err}`,
        error: String(err),
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Setup event listeners for process events
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Listen for process started events
        const unlistenStarted = await listen<ProcessEvent>(
          'process-started',
          (event) => {
            const { appId, pid, startedAt } = event.payload
            console.log(`Process started: ${appId} (PID: ${pid})`)

            setProcesses((prev) => ({
              ...prev,
              [appId]: {
                appId,
                pid: pid,
                status: 'running' as AppStatus,
                startedAt: startedAt,
                errorMessage: undefined,
                output: [],
                isBackground: false,
              },
            }))
          }
        )

        // Listen for process stopped events
        const unlistenStopped = await listen<ProcessEvent>(
          'process-stopped',
          (event) => {
            const { appId } = event.payload
            console.log(`Process stopped: ${appId}`)

            setProcesses((prev) => {
              const updated = { ...prev }
              delete updated[appId]
              return updated
            })
          }
        )

        // Listen for process exit events
        const unlistenExit = await listen<ProcessEvent>(
          'process-exit',
          (event) => {
            const { appId, exitCode } = event.payload
            console.log(`Process exited: ${appId} (Exit code: ${exitCode})`)

            setProcesses((prev) => {
              const updated = { ...prev }
              delete updated[appId]
              return updated
            })
          }
        )

        // Listen for process error events
        const unlistenError = await listen<ProcessEvent>(
          'process-error',
          (event) => {
            const { appId, error } = event.payload
            console.log(`Process error: ${appId} - ${error}`)

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
          }
        )

        // Listen for process output events
        const unlistenOutput = await listen<ProcessEvent>(
          'process-output',
          (event) => {
            const { appId, type, content, timestamp } = event.payload

            if (!appId || !content) return

            // Format terminal line with type indicator for stderr
            const typePrefix = type === 'stderr' ? '[ERR] ' : ''
            const formattedLine = `[${new Date(timestamp).toLocaleTimeString()}] ${typePrefix}${content}`

            setProcesses((prev) => {
              const currentProcess = prev[appId]
              if (!currentProcess) return prev

              // Add new line to output buffer
              const newOutput = [...currentProcess.output, formattedLine]

              // Limit buffer size (keep last 1000 lines)
              const maxLines = 1000
              const trimmedOutput = newOutput.length > maxLines
                ? newOutput.slice(-maxLines)
                : newOutput

              return {
                ...prev,
                [appId]: {
                  ...currentProcess,
                  output: trimmedOutput,
                },
              }
            })
          }
        )

        // Store unlisten functions for cleanup
        eventListeners.current = [
          unlistenStarted,
          unlistenStopped,
          unlistenExit,
          unlistenError,
          unlistenOutput,
        ]
      } catch (err) {
        console.error('Failed to setup process event listeners:', err)
        setError(err as AppError)
      }
    }

    setupEventListeners()

    // Initial load of all processes
    getAllProcesses()

    // Cleanup function
    return () => {
      eventListeners.current.forEach((unlisten) => unlisten())
      eventListeners.current = []
    }
  }, [getAllProcesses])

  return {
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
}

/**
 * Simplified hook for managing a single app's process
 */
export function useAppProcess(appId: string) {
  const {
    processes,
    isLoading,
    error,
    startProcess,
    stopProcess,
    getProcessStatus,
  } = useProcessManager()

  const process = processes[appId] || null
  const isRunning = process?.status === 'running'
  const isStarting = process?.status === 'starting'
  const isStopping = process?.status === 'stopping'
  const hasError = process?.status === 'error'

  const start = useCallback(
    (
      command: string,
      workingDirectory?: string,
      environmentVariables?: Record<string, string>
    ) => startProcess(appId, command, workingDirectory, environmentVariables),
    [appId, startProcess]
  )

  const stop = useCallback(() => stopProcess(appId), [appId, stopProcess])

  const refresh = useCallback(
    () => getProcessStatus(appId),
    [appId, getProcessStatus]
  )

  return {
    process,
    isRunning,
    isStarting,
    isStopping,
    hasError,
    isLoading,
    error,
    start,
    stop,
    refresh,
  }
}
