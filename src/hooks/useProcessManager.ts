import { useCallback, useContext } from 'react'
import {
  ProcessManagerContext,
  type ProcessManagerAPI,
} from '../context/ProcessManagerContext'
import type { AppProcess } from '../types'

export function useProcessManager(): ProcessManagerAPI {
  const ctx = useContext(ProcessManagerContext)
  if (!ctx) {
    throw new Error(
      'useProcessManager must be used within a ProcessManagerProvider'
    )
  }
  return ctx
}

export function useAppProcess(appId: string) {
  const {
    processes,
    isLoading,
    error,
    startProcess,
    stopProcess,
    getProcessStatus,
  } = useProcessManager()

  const process: AppProcess | null = processes[appId] || null
  const isRunning = process?.status === 'running'
  const isStarting = process?.status === 'starting'
  const isStopping = process?.status === 'stopping'
  const hasError = process?.status === 'error'

  const start = useCallback(
    (
      launchCommands?: string,
      workingDirectory?: string,
      environmentVariables?: Record<string, string>,
      url?: string,
      autoLaunchBrowser?: boolean,
      browserDelay?: number,
      portToCheck?: number,
      portCheckTimeout?: number
    ) =>
      startProcess(
        appId,
        launchCommands,
        workingDirectory,
        environmentVariables,
        url,
        autoLaunchBrowser,
        browserDelay,
        portToCheck,
        portCheckTimeout
      ),
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
