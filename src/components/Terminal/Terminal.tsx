import React, { useState, useRef, useEffect } from 'react'
import { Search, Copy, RotateCcw, Settings, Terminal as TerminalIcon } from 'lucide-react'
import type { AppConfig } from '../../types'
import './Terminal.css'

export interface TerminalLine {
  id: string
  timestamp: string
  content: string
  type: 'info' | 'success' | 'error' | 'warning' | 'output'
}

export interface TerminalProps {
  selectedApp: AppConfig | null
  lines?: TerminalLine[]
  maxLines?: number
  autoScroll?: boolean
  onClear?: () => void
  onCopy?: () => void
  onSearch?: (query: string) => void
}

const MOCK_TERMINAL_LINES: TerminalLine[] = [
  {
    id: '1',
    timestamp: '14:32:15',
    content: 'Starting development server...',
    type: 'info'
  },
  {
    id: '2',
    timestamp: '14:32:16',
    content: '✓ Server running at http://localhost:3000',
    type: 'success'
  },
  {
    id: '3',
    timestamp: '14:32:16',
    content: 'Ready for connections',
    type: 'output'
  },
  {
    id: '4',
    timestamp: '14:32:18',
    content: 'Hot reload enabled',
    type: 'info'
  },
  {
    id: '5',
    timestamp: '14:32:20',
    content: 'Watching for file changes...',
    type: 'output'
  },
  {
    id: '6',
    timestamp: '14:32:25',
    content: 'File change detected: src/App.tsx',
    type: 'info'
  },
  {
    id: '7',
    timestamp: '14:32:26',
    content: '⚠ Warning: Component re-render detected',
    type: 'warning'
  },
  {
    id: '8',
    timestamp: '14:32:27',
    content: '✓ Hot reload completed',
    type: 'success'
  },
  {
    id: '9',
    timestamp: '14:32:30',
    content: 'GET /api/health 200 OK',
    type: 'output'
  },
  {
    id: '10',
    timestamp: '14:32:35',
    content: 'POST /api/data 201 Created',
    type: 'success'
  },
  {
    id: '11',
    timestamp: '14:32:40',
    content: 'Connection established with database',
    type: 'info'
  },
  {
    id: '12',
    timestamp: '14:32:45',
    content: '❌ Error: Connection timeout',
    type: 'error'
  },
  {
    id: '13',
    timestamp: '14:32:46',
    content: 'Retrying connection...',
    type: 'info'
  },
  {
    id: '14',
    timestamp: '14:32:47',
    content: '✓ Connection restored',
    type: 'success'
  },
  {
    id: '15',
    timestamp: '14:32:50',
    content: 'Background task completed',
    type: 'output'
  }
]

export function Terminal({
  selectedApp,
  lines = [],
  maxLines = 1000,
  autoScroll = true,
  onClear,
  onCopy,
  onSearch
}: TerminalProps) {
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const terminalContentRef = useRef<HTMLDivElement>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Use mock lines if no real lines are provided and an app is selected
  const displayLines = selectedApp && lines.length === 0 ? MOCK_TERMINAL_LINES : lines

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (isAutoScrollEnabled && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [displayLines, isAutoScrollEnabled])

  // Limit lines to maxLines (FIFO buffer)
  const limitedLines = displayLines.slice(-maxLines)

  // Filter lines based on search query
  const filteredLines = searchQuery
    ? limitedLines.filter(line =>
        line.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : limitedLines

  const handleClearClick = () => {
    if (onClear) {
      onClear()
    }
  }

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy()
    } else {
      // Default copy implementation - copy all terminal content
      const content = filteredLines.map(line => `[${line.timestamp}] ${line.content}`).join('\n')
      navigator.clipboard.writeText(content).then(() => {
        // Visual feedback could be added here
        console.log('Terminal content copied to clipboard')
      }).catch(console.error)
    }
  }

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen)
    if (isSearchOpen) {
      setSearchQuery('')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const handleAutoScrollToggle = () => {
    setIsAutoScrollEnabled(!isAutoScrollEnabled)
  }

  const getLineClassName = (type: TerminalLine['type']) => {
    switch (type) {
      case 'success':
        return 'terminal-line success'
      case 'error':
        return 'terminal-line error'
      case 'warning':
        return 'terminal-line warning'
      case 'info':
        return 'terminal-line info'
      default:
        return 'terminal-line'
    }
  }

  // No app selected state
  if (!selectedApp) {
    return (
      <div className="terminal">
        <div className="terminal-header">
          <div className="terminal-title-section">
            <TerminalIcon size={16} />
            <span className="terminal-title">Terminal Output</span>
          </div>
          <div className="terminal-controls">
            <button className="terminal-control-button" disabled title="Clear">
              <RotateCcw size={14} />
            </button>
            <button className="terminal-control-button" disabled title="Copy">
              <Copy size={14} />
            </button>
            <button className="terminal-control-button" disabled title="Search">
              <Search size={14} />
            </button>
            <button className="terminal-control-button" disabled title="Settings">
              <Settings size={14} />
            </button>
          </div>
        </div>

        <div className="terminal-content no-app-selected">
          <div className="no-app-terminal-message">
            <TerminalIcon size={48} />
            <h3>No App Selected</h3>
            <p>Select an app from the sidebar to view its terminal output.</p>
            <p>Once you start an app, its output will appear here in real-time.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-title-section">
          <TerminalIcon size={16} />
          <span className="terminal-title">Terminal Output - {selectedApp.name}</span>
          {displayLines.length > 0 && (
            <span className="terminal-line-count">({filteredLines.length} lines)</span>
          )}
        </div>

        <div className="terminal-controls">
          <button
            className={`terminal-control-button auto-scroll ${isAutoScrollEnabled ? 'active' : ''}`}
            onClick={handleAutoScrollToggle}
            title={`Auto-scroll: ${isAutoScrollEnabled ? 'ON' : 'OFF'}`}
          >
            📜
          </button>
          <button
            className="terminal-control-button"
            onClick={handleClearClick}
            title="Clear Terminal"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="terminal-control-button"
            onClick={handleCopyClick}
            title="Copy All Output"
          >
            <Copy size={14} />
          </button>
          <button
            className={`terminal-control-button ${isSearchOpen ? 'active' : ''}`}
            onClick={handleSearchClick}
            title="Search Terminal"
          >
            <Search size={14} />
          </button>
          <button
            className="terminal-control-button"
            disabled
            title="Terminal Settings (Coming Soon)"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="terminal-search-bar">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search terminal output..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="terminal-search-input"
              autoFocus
            />
            <button type="submit" className="terminal-search-button">
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="terminal-search-clear"
              disabled={!searchQuery}
            >
              Clear
            </button>
          </form>
        </div>
      )}

      <div className="terminal-content" ref={terminalContentRef}>
        {filteredLines.length === 0 ? (
          <div className="terminal-empty-state">
            <p>No output yet...</p>
            <p>Terminal output will appear here when the app starts.</p>
          </div>
        ) : (
          <>
            {filteredLines.map((line) => (
              <div key={line.id} className={getLineClassName(line.type)}>
                <span className="terminal-timestamp">[{line.timestamp}]</span>
                <span className="terminal-output">{line.content}</span>
              </div>
            ))}
            {/* Auto-scroll anchor */}
            <div ref={terminalEndRef} />

            {/* Cursor (only show if auto-scroll is enabled and this is the latest content) */}
            {isAutoScrollEnabled && searchQuery === '' && (
              <div className="terminal-cursor">_</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
