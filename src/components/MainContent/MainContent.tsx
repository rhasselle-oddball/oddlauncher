import { MainAppHeader } from '../MainAppHeader'
import { Terminal } from '../Terminal'
import { useProcessManager } from '../../hooks/useProcessManager'
import { useConfigManager } from '../../hooks/useConfig'
import { getAppType } from '../../types'
import type { AppConfig } from '../../types'
import './MainContent.css'

interface MainContentProps {
  selectedApp: AppConfig | null
  onEdit?: (app: AppConfig) => void
  onDelete?: (app: AppConfig) => void
  onOpenUrl?: (app: AppConfig) => void
  onOpenDirectory?: (app: AppConfig) => void
  /** Optional shared config manager instance to avoid duplicate state */
  configManager?: ReturnType<typeof useConfigManager>
  // Terminal props
  terminalLines?: Array<{
    id: string
    timestamp: string
    content: string
    type: 'info' | 'success' | 'error' | 'warning' | 'output'
  }>
  onTerminalClear?: () => void
  onTerminalCopy?: () => void
  onTerminalSearch?: (query: string) => void
}

export function MainContent({
  selectedApp,
  onEdit,
  onDelete,
  onOpenUrl,
  onOpenDirectory,
  configManager: externalManager,
  terminalLines = [],
  onTerminalClear,
  onTerminalCopy,
  onTerminalSearch
}: MainContentProps) {
  const { processes, clearProcessOutput } = useProcessManager()
  const internalManager = useConfigManager()
  const configManager = externalManager || internalManager

  // Get process output for the selected app
  const selectedAppProcess = selectedApp ? processes[selectedApp.id] : null
  const processOutput = selectedAppProcess?.output || []

  // Debug: log output length for the selected app
  if (selectedApp) {
    console.log('[MainContent] selectedApp', selectedApp.id, 'output lines:', processOutput.length)
  }

  // Clear terminal output for current app
  const clearTerminalOutput = () => {
    if (selectedApp) {
      clearProcessOutput(selectedApp.id)
    }
  }

  // Default terminal handlers if not provided
  const handleTerminalClear = onTerminalClear || clearTerminalOutput

  const handleTerminalCopy = onTerminalCopy || (() => {
    console.log('Terminal copy requested (placeholder)')
  })

  const handleTerminalSearch = onTerminalSearch || ((query: string) => {
    console.log('Terminal search requested:', query)
  })

  return (
    <div className="main-content">
      <div className="main-content-header">
        <MainAppHeader
          selectedApp={selectedApp}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenUrl={onOpenUrl}
          onOpenDirectory={onOpenDirectory}
          configManager={configManager}
        />
      </div>

      {(!selectedApp || getAppType(selectedApp) !== 'bookmark') && (
        <div className="main-content-terminal">
          <Terminal
            selectedApp={selectedApp}
            lines={terminalLines}
            rawOutput={processOutput}
            onClear={handleTerminalClear}
            onCopy={handleTerminalCopy}
            onSearch={handleTerminalSearch}
            autoScroll={true}
            maxLines={1000}
          />
        </div>
      )}
    </div>
  )
}
