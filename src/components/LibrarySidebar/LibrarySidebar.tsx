import React, { useState, useMemo } from 'react'
import { AppListItem } from '../AppListItem'
import { useConfigManager } from '../../hooks/useConfig'
import type { AppConfig } from '../../types'
import './LibrarySidebar.css'

interface LibrarySidebarProps {
  selectedAppId: string | null
  onAppSelect: (app: AppConfig | null) => void
  onAddApp: () => void
}

export function LibrarySidebar({ selectedAppId, onAppSelect, onAddApp }: LibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const configManager = useConfigManager()

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!configManager.config?.apps) return []
    
    if (!searchQuery.trim()) {
      return configManager.config.apps
    }

    const query = searchQuery.toLowerCase().trim()
    return configManager.config.apps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.command.toLowerCase().includes(query) ||
      (app.tags && app.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }, [configManager.config?.apps, searchQuery])

  const handleAppClick = (app: AppConfig) => {
    onAppSelect(app)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleAddAppClick = () => {
    onAddApp()
  }

  // Loading state
  if (configManager.isLoading) {
    return (
      <div className="library-sidebar">
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search apps..."
            className="search-input"
            disabled
          />
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading apps...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (configManager.error) {
    return (
      <div className="library-sidebar">
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search apps..."
            className="search-input"
            disabled
          />
        </div>
        <div className="error-state">
          <p>Failed to load apps</p>
          <button 
            className="retry-button"
            onClick={() => configManager.loadConfig()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state (no apps configured)
  if (filteredApps.length === 0 && !searchQuery.trim()) {
    return (
      <div className="library-sidebar">
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search apps..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h3>No Apps Yet</h3>
          <p>Get started by adding your first development app.</p>
          <button 
            className="add-app-button primary"
            onClick={handleAddAppClick}
          >
            + Add Your First App
          </button>
        </div>
      </div>
    )
  }

  // No search results
  if (filteredApps.length === 0 && searchQuery.trim()) {
    return (
      <div className="library-sidebar">
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search apps..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="no-results-state">
          <div className="no-results-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>Try adjusting your search terms or add a new app.</p>
          <button 
            className="add-app-button"
            onClick={handleAddAppClick}
          >
            + Add New App
          </button>
        </div>
      </div>
    )
  }

  // Normal state with apps
  return (
    <div className="library-sidebar">
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search apps..."
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="app-list">
        {filteredApps.map((app) => {
          return (
            <AppListItem
              key={app.id}
              app={app}
              status="stopped" // TODO: Get real status from process in Phase 3
              isSelected={selectedAppId === app.id}
              onClick={handleAppClick}
            />
          )
        })}
      </div>

      <div className="sidebar-actions">
        <button 
          className="add-app-button"
          onClick={handleAddAppClick}
        >
          + Add New App
        </button>
      </div>
    </div>
  )
}
