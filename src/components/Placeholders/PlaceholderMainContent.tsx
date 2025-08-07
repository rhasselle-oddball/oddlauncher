import './PlaceholderMainContent.css'

export function PlaceholderMainContent() {
  return (
    <div className="placeholder-main-content">
      <div className="placeholder-header">
        <div className="placeholder-app-info">
          <div className="placeholder-app-details">
            <h2 className="placeholder-app-title">React Dev Server</h2>
            <p className="placeholder-app-command">npm run dev</p>
            <p className="placeholder-app-directory">/home/user/my-react-app</p>
            <p className="placeholder-app-url">http://localhost:3000</p>
          </div>
        </div>

        <div className="placeholder-controls">
          <button className="placeholder-start-button running" disabled>
            🟢 Running
          </button>
          <div className="placeholder-action-buttons">
            <button className="placeholder-action-button" disabled title="Edit">
              ⚙️
            </button>
            <button className="placeholder-action-button" disabled title="Open URL">
              🌐
            </button>
            <button className="placeholder-action-button" disabled title="Open Directory">
              📁
            </button>
            <button className="placeholder-action-button delete" disabled title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="placeholder-terminal">
        <div className="placeholder-terminal-header">
          <span className="terminal-title">Terminal Output</span>
          <div className="terminal-controls">
            <button className="terminal-control-button" disabled title="Clear">Clear</button>
            <button className="terminal-control-button" disabled title="Copy">Copy</button>
            <button className="terminal-control-button" disabled title="Search">Search</button>
          </div>
        </div>

        <div className="placeholder-terminal-content">
          <div className="terminal-line">
            <span className="timestamp">[14:32:15]</span>
            <span className="output">Starting development server...</span>
          </div>
          <div className="terminal-line">
            <span className="timestamp">[14:32:16]</span>
            <span className="output success">✓ Server running at http://localhost:3000</span>
          </div>
          <div className="terminal-line">
            <span className="timestamp">[14:32:16]</span>
            <span className="output">Ready for connections</span>
          </div>
          <div className="terminal-line">
            <span className="timestamp">[14:32:18]</span>
            <span className="output info">Hot reload enabled</span>
          </div>
          <div className="terminal-line">
            <span className="timestamp">[14:32:20]</span>
            <span className="output">Watching for file changes...</span>
          </div>
          <div className="terminal-cursor">_</div>
        </div>
      </div>
    </div>
  )
}
