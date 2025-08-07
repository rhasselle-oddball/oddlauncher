import './PlaceholderSidebar.css'

export function PlaceholderSidebar() {
  return (
    <div className="placeholder-sidebar">
      <div className="placeholder-search">
        <input
          type="text"
          placeholder="Search apps..."
          className="search-input"
          disabled
        />
      </div>

      <div className="placeholder-app-list">
        <div className="placeholder-app-item">
          <div className="placeholder-thumbnail"></div>
          <div className="placeholder-details">
            <div className="placeholder-name">React Dev Server</div>
            <div className="placeholder-status running">● Running</div>
          </div>
        </div>

        <div className="placeholder-app-item">
          <div className="placeholder-thumbnail"></div>
          <div className="placeholder-details">
            <div className="placeholder-name">API Server</div>
            <div className="placeholder-status stopped">● Stopped</div>
          </div>
        </div>

        <div className="placeholder-app-item">
          <div className="placeholder-thumbnail"></div>
          <div className="placeholder-details">
            <div className="placeholder-name">Database</div>
            <div className="placeholder-status starting">● Starting</div>
          </div>
        </div>
      </div>

      <div className="placeholder-actions">
        <button className="add-app-button" disabled>
          + Add New App
        </button>
      </div>
    </div>
  )
}
