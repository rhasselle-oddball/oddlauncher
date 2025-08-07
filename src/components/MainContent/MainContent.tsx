import { MainAppHeader } from '../MainAppHeader'
import { Terminal } from '../Terminal'
import { useProcessManager } from '../../hooks/useProcessManager'
import type { AppConfig } from '../../types'
import './MainContent.css'

interface MainContentProps {
  selectedApp: AppConfig | null
  onEdit?: (app: AppConfig) => void
  onDelete?: (app: AppConfig) => void
  onDuplicate?: (app: AppConfig) => void
  onExportApp?: (app: AppConfig) => void
  onImportApp?: () => void
  onOpenUrl?: (app: AppConfig) => void
  onOpenDirectory?: (app: AppConfig) => void
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
  onDuplicate,
  onExportApp,
  onImportApp,
  onOpenUrl,
  onOpenDirectory,
  terminalLines = [],
  onTerminalClear,
  onTerminalCopy,
  onTerminalSearch
}: MainContentProps) {
  const { processes, clearProcessOutput } = useProcessManager()

  // Get process output for the selected app
  const selectedAppProcess = selectedApp ? processes[selectedApp.id] : null
  const processOutput = selectedAppProcess?.output || []

  // Convert process output strings to TerminalLine objects
  const processTerminalLines = processOutput.map((line, index) => {
    // Parse the formatted line that comes from useProcessManager
    // Format: "[HH:MM:SS] [ERR] content" or "[HH:MM:SS] content"
    const timestampMatch = line.match(/^\[(\d{1,2}:\d{2}:\d{2})\]/)
    const timestamp = timestampMatch ? timestampMatch[1] : new Date().toLocaleTimeString()

    // Extract content after timestamp
    let content = timestampMatch ? line.substring(timestampMatch[0].length).trim() : line

    // Detect if it's an error line and extract content
    let type: 'info' | 'success' | 'error' | 'warning' | 'output' = 'output'
    if (content.startsWith('[ERR]')) {
      type = 'error'
      content = content.substring(5).trim()
    } else if (content.includes('✓') || content.toLowerCase().includes('success')) {
      type = 'success'
    } else if (content.includes('⚠') || content.toLowerCase().includes('warning')) {
      type = 'warning'
    } else if (content.toLowerCase().includes('error')) {
      type = 'error'
    }

    return {
      id: `process-${selectedApp?.id}-${index}`,
      timestamp,
      content,
      type
    }
  })

  // Combine terminal lines with process output lines
  const allTerminalLines = [...terminalLines, ...processTerminalLines]

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
          onDuplicate={onDuplicate}
          onExportApp={onExportApp}
          onImportApp={onImportApp}
          onOpenUrl={onOpenUrl}
          onOpenDirectory={onOpenDirectory}
        />
      </div>

      <div className="main-content-terminal">
        <Terminal
          selectedApp={selectedApp}
          lines={allTerminalLines}
          onClear={handleTerminalClear}
          onCopy={handleTerminalCopy}
          onSearch={handleTerminalSearch}
          autoScroll={true}
          maxLines={1000}
        />
      </div>
    </div>
  )
}
