import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './DebugModal.css'

interface DebugInfo {
  command: string
  program: string
  args: string[]
  working_directory: string | null
  system_info: {
    os: string
    arch: string
    family: string
  }
  working_directory_status?: {
    exists: boolean
    is_directory: boolean
  }
  program_status: {
    found_in_path: boolean
    full_path?: string
  }
  environment: {
    PATH: string
  }
}

interface DebugModalProps {
  isOpen: boolean
  onClose: () => void
  appName: string
  command: string
  workingDirectory?: string
  errorMessage?: string
}

export default function DebugModal({
  isOpen,
  onClose,
  appName,
  command,
  workingDirectory,
  errorMessage,
}: DebugModalProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugError, setDebugError] = useState<string | null>(null)

  const loadDebugInfo = async () => {
    if (!command) return

    setIsLoading(true)
    setDebugError(null)

    try {
      const info = await invoke<DebugInfo>('get_debug_info', {
        command,
        workingDirectory,
      })
      setDebugInfo(info)
    } catch (error) {
      console.error('Failed to get debug info:', error)
      setDebugError(String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    if (isOpen) {
      loadDebugInfo()
    }
  }

  // Load debug info when modal opens
  useState(() => {
    handleOpen()
  })

  if (!isOpen) return null

  return (
    <div className="debug-modal-overlay">
      <div className="debug-modal">
        <div className="debug-modal__header">
          <h2>Debug Information - {appName}</h2>
          <button className="debug-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="debug-modal__content">
          {errorMessage && (
            <div className="debug-section">
              <h3>Error Message</h3>
              <div className="debug-error">{errorMessage}</div>
            </div>
          )}

          <div className="debug-section">
            <h3>Basic Info</h3>
            <div className="debug-info">
              <div><strong>Command:</strong> {command}</div>
              <div><strong>Working Directory:</strong> {workingDirectory || 'Not set'}</div>
            </div>
          </div>

          {isLoading && (
            <div className="debug-loading">
              Loading debug information...
            </div>
          )}

          {debugError && (
            <div className="debug-section">
              <h3>Debug Error</h3>
              <div className="debug-error">{debugError}</div>
            </div>
          )}

          {debugInfo && !isLoading && (
            <>
              <div className="debug-section">
                <h3>System Information</h3>
                <div className="debug-info">
                  <div><strong>OS:</strong> {debugInfo.system_info.os}</div>
                  <div><strong>Architecture:</strong> {debugInfo.system_info.arch}</div>
                  <div><strong>Family:</strong> {debugInfo.system_info.family}</div>
                </div>
              </div>

              <div className="debug-section">
                <h3>Command Analysis</h3>
                <div className="debug-info">
                  <div><strong>Program:</strong> {debugInfo.program}</div>
                  <div><strong>Arguments:</strong> [{debugInfo.args.join(', ')}]</div>
                  <div>
                    <strong>Found in PATH:</strong>{' '}
                    <span className={debugInfo.program_status.found_in_path ? 'status-ok' : 'status-error'}>
                      {debugInfo.program_status.found_in_path ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {debugInfo.program_status.full_path && (
                    <div><strong>Full Path:</strong> {debugInfo.program_status.full_path}</div>
                  )}
                </div>
              </div>

              {debugInfo.working_directory_status && (
                <div className="debug-section">
                  <h3>Working Directory Status</h3>
                  <div className="debug-info">
                    <div>
                      <strong>Directory Exists:</strong>{' '}
                      <span className={debugInfo.working_directory_status.exists ? 'status-ok' : 'status-error'}>
                        {debugInfo.working_directory_status.exists ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <strong>Is Directory:</strong>{' '}
                      <span className={debugInfo.working_directory_status.is_directory ? 'status-ok' : 'status-error'}>
                        {debugInfo.working_directory_status.is_directory ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="debug-section">
                <h3>Environment</h3>
                <div className="debug-info">
                  <div><strong>PATH:</strong></div>
                  <div className="debug-path">
                    {debugInfo.environment.PATH.split(':').map((path, index) => (
                      <div key={index} className="path-entry">{path}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="debug-section">
                <h3>Troubleshooting Suggestions</h3>
                <div className="debug-suggestions">
                  {!debugInfo.program_status.found_in_path && (
                    <div className="suggestion">
                      ❗ The command <code>{debugInfo.program}</code> was not found in your PATH.
                      Make sure it's installed and available in your shell.
                    </div>
                  )}
                  {debugInfo.working_directory_status && !debugInfo.working_directory_status.exists && (
                    <div className="suggestion">
                      ❗ The working directory does not exist. Check the path: <code>{debugInfo.working_directory}</code>
                    </div>
                  )}
                  {debugInfo.working_directory_status && debugInfo.working_directory_status.exists && !debugInfo.working_directory_status.is_directory && (
                    <div className="suggestion">
                      ❗ The working directory path points to a file, not a directory.
                    </div>
                  )}
                  {debugInfo.program_status.found_in_path && debugInfo.working_directory_status?.exists && (
                    <div className="suggestion">
                      ✅ Basic setup looks good. The error might be related to the specific arguments or runtime environment.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="debug-modal__footer">
          <button onClick={loadDebugInfo} disabled={isLoading}>
            Refresh Debug Info
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
