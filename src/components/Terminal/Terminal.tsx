import React, { useState, useRef, useEffect, useMemo } from 'react'
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
  rawOutput?: string[]  // Add support for raw string output
  maxLines?: number
  autoScroll?: boolean
  onClear?: () => void
  onCopy?: () => void
  onSearch?: (query: string) => void
}

export function Terminal({
  selectedApp,
  lines = [],
  rawOutput = [],
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

  // Convert raw output to TerminalLine objects and combine with structured lines
  const displayLines = useMemo(() => {
    const structuredLines = lines || []

    // Convert raw output strings to TerminalLine objects
    const convertedRawLines: TerminalLine[] = rawOutput.map((line, index) => {
      // Parse timestamp if present in format [HH:MM:SS]
      const timestampMatch = line.match(/^\[(\d{1,2}:\d{2}:\d{2})\]/)
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toLocaleTimeString()

      // Extract content (remove timestamp if present)
      let content = timestampMatch ? line.substring(timestampMatch[0].length).trim() : line

      // Detect line type based on content
      let type: TerminalLine['type'] = 'output'
      if (content.startsWith('[ERR]')) {
        type = 'error'
        content = content.substring(5).trim() // Remove [ERR] prefix
      } else if (content.includes('✓') || content.toLowerCase().includes('success')) {
        type = 'success'
      } else if (content.includes('⚠') || content.toLowerCase().includes('warning')) {
        type = 'warning'
      } else if (content.toLowerCase().includes('error')) {
        type = 'error'
      }

      return {
        id: `raw-${index}-${Date.now()}`,
        timestamp,
        content,
        type
      }
    })

    // Combine structured lines and converted raw lines
    return [...structuredLines, ...convertedRawLines]
  }, [lines, rawOutput])

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
