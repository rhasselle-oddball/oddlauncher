import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Copy, RotateCcw, Terminal as TerminalIcon, ArrowDown } from 'lucide-react'
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })
  const terminalContentRef = useRef<HTMLDivElement>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Convert raw output to TerminalLine objects and combine with structured lines
  const displayLines = useMemo(() => {
    // Debug: observe rawOutput length reaching Terminal
    if (rawOutput) {
      console.log('[Terminal] rawOutput len', rawOutput.length)
    }
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

  // Helper function to get terminal display name
  const getTerminalDisplayName = (terminalType?: string) => {
    if (!terminalType) return 'System Default'

    const terminalNames: Record<string, string> = {
      'cmd': 'Command Prompt',
      'powershell': 'PowerShell',
      'pwsh': 'PowerShell Core',
      'gitbash': 'Git Bash',
      'wsl': 'WSL',
      'bash': 'Bash',
      'zsh': 'Zsh',
      'fish': 'Fish',
      'sh': 'Shell'
    }

    return terminalNames[terminalType] || terminalType
  }

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
  // Debug: observe how many lines will render
  console.log('[Terminal] displayLines len', displayLines.length)
    if (isAutoScrollEnabled && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [displayLines, isAutoScrollEnabled])

  // Keyboard shortcuts for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when terminal is focused or has text selected
      const isTerminalFocused = terminalContentRef.current?.contains(document.activeElement)
      const hasSelection = window.getSelection()?.toString().trim()

      if (!isTerminalFocused && !hasSelection) return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' && hasSelection) {
          // Copy selected text (let browser handle this naturally)
          return
        }
        if (e.key === 'a') {
          // Select all terminal content
          e.preventDefault()
          const range = document.createRange()
          if (terminalContentRef.current) {
            range.selectNodeContents(terminalContentRef.current)
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  const handleCopyClick = async () => {
    try {
      const selection = window.getSelection()
      let textToCopy = ''

      if (selection && selection.toString().trim()) {
        // Copy selected text
        textToCopy = selection.toString()
      } else if (onCopy) {
        // Use provided copy handler
        onCopy()
        return
      } else {
        // Copy all terminal content if nothing is selected
        textToCopy = filteredLines.map(line => `[${line.timestamp}] ${line.content}`).join('\n')
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy)
        console.log('Terminal content copied to clipboard')

        // Optional: Show a brief feedback (you could add a toast notification here)
        // For now, just log it
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)

      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        const fallbackText = filteredLines.map(line => `[${line.timestamp}] ${line.content}`).join('\n')
        textArea.value = fallbackText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        console.log('Terminal content copied to clipboard (fallback)')
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
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

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true
    })
  }

  const handleContextMenuCopy = () => {
    handleCopyClick()
    setContextMenu(prev => ({ ...prev, show: false }))
  }

  const handleContextMenuSelectAll = () => {
    const range = document.createRange()
    if (terminalContentRef.current) {
      range.selectNodeContents(terminalContentRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
    setContextMenu(prev => ({ ...prev, show: false }))
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, show: false }))
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

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
      <div className="terminal-container">
        <div className="terminal-content">
          <div className="no-app-selected">
            <div className="no-app-icon">
              <TerminalIcon size={48} />
            </div>
            <h3>No Launcher Selected</h3>
            <p>Select a launcher to view output here.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-title-section">
          <TerminalIcon size={18} />
          <span className="terminal-title">Terminal Output ({getTerminalDisplayName(selectedApp.terminalType)}) - {selectedApp.name}</span>
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
              <ArrowDown size={16} />
          </button>
          <button
            className="terminal-control-button"
            onClick={handleClearClick}
            title="Clear Terminal"
          >
              <RotateCcw size={16} />
          </button>
          <button
            className="terminal-control-button"
            onClick={handleCopyClick}
            title="Copy All Output"
          >
              <Copy size={16} />
          </button>
          <button
            className={`terminal-control-button ${isSearchOpen ? 'active' : ''}`}
            onClick={handleSearchClick}
            title="Search Terminal"
          >
              <Search size={16} />
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

      <div className="terminal-content" ref={terminalContentRef} onContextMenu={handleContextMenu}>
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

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="terminal-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={handleContextMenuCopy} className="terminal-context-menu-item">
            <Copy size={14} />
            Copy {window.getSelection()?.toString().trim() ? 'Selected' : 'All'}
          </button>
          <button onClick={handleContextMenuSelectAll} className="terminal-context-menu-item">
            Select All
          </button>
        </div>
      )}
    </div>
  )
}
