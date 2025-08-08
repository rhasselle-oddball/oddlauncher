import { useContext } from 'react'
import { ProcessManagerContext } from '../context/ProcessManagerContext'

export function useProcessManager() {
  const ctx = useContext(ProcessManagerContext)
  if (!ctx)
    throw new Error(
      'useProcessManager must be used within ProcessManagerProvider'
    )
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

  const process = processes[appId] || null
  const isRunning = process?.status === 'running'
  const isStarting = process?.status === 'starting'
  const isStopping = process?.status === 'stopping'
  const hasError = process?.status === 'error'

  const start = (
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
    )

  const stop = () => stopProcess(appId)
  const refresh = () => getProcessStatus(appId)

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
