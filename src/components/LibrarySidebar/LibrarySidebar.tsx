import { useState, useMemo, ChangeEvent, useEffect } from 'react'
import { Smartphone, Search } from 'lucide-react'
import { AppListItem } from '../AppListItem'
import { useConfigManager } from '../../hooks/useConfig'
import type { AppConfig } from '../../types'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableAppListItem } from './SortableAppListItem'
import './LibrarySidebar.css'

interface LibrarySidebarProps {
  selectedAppId: string | null
  onAppSelect: (app: AppConfig | null) => void
  onAddApp: () => void
}

export function LibrarySidebar({ selectedAppId, onAppSelect, onAddApp }: LibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localAppOrder, setLocalAppOrder] = useState<AppConfig[]>([])
  const configManager = useConfigManager()

  // Set up drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  )

  // Update local app order when config changes
  useEffect(() => {
    if (configManager.config?.apps) {
      setLocalAppOrder([...configManager.config.apps])
    }
  }, [configManager.config?.apps])

  // Filter apps based on search query - use localAppOrder when not searching
  const filteredApps = useMemo(() => {
    const appsToFilter = searchQuery.trim() ? configManager.config?.apps || [] : localAppOrder

    if (!searchQuery.trim()) {
      return appsToFilter
    }

    const query = searchQuery.toLowerCase().trim()
    return appsToFilter.filter(app =>
      app.name.toLowerCase().includes(query) ||
      (app.launchCommands && app.launchCommands.toLowerCase().includes(query)) ||
      (app.tags && app.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }, [configManager.config?.apps, localAppOrder, searchQuery])

  // Handle drag end - reorder apps
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = localAppOrder.findIndex(app => app.id === active.id)
    const newIndex = localAppOrder.findIndex(app => app.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(localAppOrder, oldIndex, newIndex)
      setLocalAppOrder(newOrder)

      // Update the order in the backend
      try {
        const newConfig = {
          ...configManager.config!,
          apps: newOrder
        }
        await configManager.saveConfig(newConfig)
      } catch (error) {
        console.error('Failed to save app order:', error)
        // Revert on error
        setLocalAppOrder(localAppOrder)
      }
    }
  }

  const handleAppClick = (app: AppConfig) => {
    onAppSelect(app)
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
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
          <div className="empty-icon">
            <Smartphone size={48} />
          </div>
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
          <div className="no-results-icon">
            <Search size={48} />
          </div>
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
        {searchQuery.trim() ? (
          // When searching, show regular list items (no drag and drop)
          filteredApps.map((app) => (
            <AppListItem
              key={app.id}
              app={app}
              isSelected={selectedAppId === app.id}
              onClick={handleAppClick}
            />
          ))
        ) : (
          // When not searching, enable drag and drop reordering
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredApps.map(app => app.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredApps.map((app) => (
                <SortableAppListItem
                  key={app.id}
                  app={app}
                  selectedAppId={selectedAppId}
                  onAppSelect={handleAppClick}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
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
