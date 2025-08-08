import { useState, useMemo, ChangeEvent, useEffect } from 'react'
import { Smartphone, Search } from 'lucide-react'
import { AppListItem } from '../AppListItem'
import { useConfigManager } from '../../hooks/useConfig'
import type { AppConfig } from '../../types'
// import { getAppType } from '../../types'
import { useProcessManager } from '../../hooks/useProcessManager'
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
  /** Optional shared config manager instance to avoid duplicate state */
  configManager?: ReturnType<typeof useConfigManager>
}

export function LibrarySidebar({ selectedAppId, onAppSelect, onAddApp, configManager: externalManager }: LibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showRunningOnly, setShowRunningOnly] = useState(false)
  const [recentWindow, setRecentWindow] = useState<'none' | 'thisMonth' | 'lastMonth' | 'last3Months'>('none')
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'za'>('recent')
  const [localAppOrder, setLocalAppOrder] = useState<AppConfig[]>([])
  const internalManager = useConfigManager()
  const configManager = externalManager || internalManager
  const { processes } = useProcessManager()
  // Restore persisted filters
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('sidebarFilters')
      if (persisted) {
        const parsed = JSON.parse(persisted)
        if (typeof parsed.showRunningOnly === 'boolean') setShowRunningOnly(parsed.showRunningOnly)
        if (parsed.recentWindow) setRecentWindow(parsed.recentWindow)
        if (parsed.sortBy) setSortBy(parsed.sortBy)
      }
    } catch (e) {
      console.warn('Failed to restore sidebar filters', e)
    }
  }, [])

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem('sidebarFilters', JSON.stringify({ showRunningOnly, recentWindow, sortBy }))
    } catch (e) {
      console.warn('Failed to persist sidebar filters', e)
    }
  }, [showRunningOnly, recentWindow, sortBy])

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

  // Filter + sort apps
  const filteredApps = useMemo(() => {
    const appsSource = searchQuery.trim() ? (configManager.config?.apps || []) : localAppOrder
    const now = new Date()

    const inRecentWindow = (app: AppConfig) => {
      if (recentWindow === 'none') return true
      const ts = app.lastUsedAt ? new Date(app.lastUsedAt) : null
      if (!ts) return false
      const month = now.getMonth()
      const year = now.getFullYear()
      const appMonth = ts.getMonth()
      const appYear = ts.getFullYear()
      if (recentWindow === 'thisMonth') return appYear === year && appMonth === month
      if (recentWindow === 'lastMonth') {
        const lastMonth = (month + 11) % 12
        const lastYear = month === 0 ? year - 1 : year
        return appYear === lastYear && appMonth === lastMonth
      }
      if (recentWindow === 'last3Months') {
        const diffMonths = (year - appYear) * 12 + (month - appMonth)
        return diffMonths >= 0 && diffMonths <= 2
      }
      return true
    }

    const matchesSearch = (app: AppConfig) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        app.name.toLowerCase().includes(q) ||
        (app.launchCommands && app.launchCommands.toLowerCase().includes(q)) ||
        (app.tags && app.tags.some(tag => tag.toLowerCase().includes(q)))
      )
    }

    let list = appsSource.filter(app => matchesSearch(app) && inRecentWindow(app))

    if (showRunningOnly) {
      // Use live process state to include only currently running apps
      list = list.filter(a => processes[a.id]?.status === 'running')
    }

    // Sorting
    list = [...list]
    if (sortBy === 'recent') {
      list.sort((a, b) => (b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0) - (a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0))
    } else if (sortBy === 'az') {
      list.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'za') {
      list.sort((a, b) => b.name.localeCompare(a.name))
    }

    return list
  }, [configManager.config?.apps, localAppOrder, searchQuery, showRunningOnly, recentWindow, sortBy, processes])

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
        <div className="sidebar-filters">
          <label className="filter-chip">
            <input type="checkbox" checked={showRunningOnly} onChange={(e) => setShowRunningOnly(e.target.checked)} /> Running
          </label>
          <select className="filter-select" value={recentWindow} onChange={(e) => setRecentWindow(e.target.value as 'none' | 'thisMonth' | 'lastMonth' | 'last3Months')}>
            <option value="none">All time</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="last3Months">Last 3 months</option>
          </select>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'recent' | 'az' | 'za')}>
            <option value="recent">Sort: Recently used</option>
            <option value="az">Sort: A–Z</option>
            <option value="za">Sort: Z–A</option>
          </select>
        </div>
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
