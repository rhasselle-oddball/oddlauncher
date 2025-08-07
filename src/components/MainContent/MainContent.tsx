import { MainAppHeader } from '../MainAppHeader'
import { Terminal } from '../Terminal'
import type { AppConfig } from '../../types'
import './MainContent.css'

interface MainContentProps {
  selectedApp: AppConfig | null
  onEdit?: (app: AppConfig) => void
  onDelete?: (app: AppConfig) => void
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
  onOpenUrl,
  onOpenDirectory,
  terminalLines = [],
  onTerminalClear,
  onTerminalCopy,
  onTerminalSearch
}: MainContentProps) {

  // Default terminal handlers if not provided
  const handleTerminalClear = onTerminalClear || (() => {
    console.log('Terminal clear requested (placeholder)')
  })

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
        />
      </div>

      <div className="main-content-terminal">
        <Terminal
          selectedApp={selectedApp}
          lines={terminalLines}
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
