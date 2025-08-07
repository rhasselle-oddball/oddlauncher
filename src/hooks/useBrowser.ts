import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface BrowserHook {
  openUrlInBrowser: (url: string) => Promise<boolean>
  checkPortReady: (url: string) => Promise<boolean>
  waitForPortReady: (url: string, timeoutSeconds?: number) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

/**
 * Hook for browser operations and URL launching
 */
export function useBrowser(): BrowserHook {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openUrlInBrowser = useCallback(
    async (url: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        await invoke('open_url_in_browser', { url })
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        console.error('Failed to open URL in browser:', errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const checkPortReady = useCallback(async (url: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const isReady = await invoke<boolean>('check_port_ready', { url })
      return isReady
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      console.error('Failed to check port readiness:', errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const waitForPortReady = useCallback(
    async (url: string, timeoutSeconds = 30): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const isReady = await invoke<boolean>('wait_for_port_ready', {
          url,
          timeoutSeconds,
        })
        return isReady
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        console.error('Failed to wait for port readiness:', errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    openUrlInBrowser,
    checkPortReady,
    waitForPortReady,
    isLoading,
    error,
  }
}

export default useBrowser
