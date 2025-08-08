import { useState, useMemo, ChangeEvent, useEffect } from 'react'
import { Smartphone, Search, Clock, ArrowDownAZ } from 'lucide-react'
import { AppListItem } from '../AppListItem'
import { useConfigManager } from '../../hooks/useConfig'
import type { AppConfig } from '../../types'
// import { getAppType } from '../../types'
// import { useProcessManager } from '../../hooks/useProcessManager'
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
  const [sortBy, setSortBy] = useState<'recent' | 'az'>('recent')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [localAppOrder, setLocalAppOrder] = useState<AppConfig[]>([])
  const internalManager = useConfigManager()
  const configManager = externalManager || internalManager
  // const { processes } = useProcessManager()
  // Restore persisted filters
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('sidebarFilters')
      if (persisted) {
        const parsed = JSON.parse(persisted)
        if (parsed.sortBy === 'recent' || parsed.sortBy === 'az') setSortBy(parsed.sortBy)
      }
      const persistedCollapsed = localStorage.getItem('sidebarCollapsedSections')
      if (persistedCollapsed) setCollapsedSections(JSON.parse(persistedCollapsed))
    } catch (e) {
      console.warn('Failed to restore sidebar filters', e)
    }
  }, [])

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem('sidebarFilters', JSON.stringify({ sortBy }))
    } catch (e) {
      console.warn('Failed to persist sidebar filters', e)
    }
  }, [sortBy])

  // Persist collapsed sections
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsedSections', JSON.stringify(collapsedSections))
    } catch (e) {
      console.warn('Failed to persist collapsed sections', e)
    }
  }, [collapsedSections])

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
    // const now = new Date()

    const matchesSearch = (app: AppConfig) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        app.name.toLowerCase().includes(q) ||
        (app.launchCommands && app.launchCommands.toLowerCase().includes(q)) ||
        (app.tags && app.tags.some(tag => tag.toLowerCase().includes(q)))
      )
    }

  let list = appsSource.filter(app => matchesSearch(app))

    // Sorting
    list = [...list]
    if (sortBy === 'recent') {
      list.sort((a, b) => (b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0) - (a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0))
    } else if (sortBy === 'az') {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }

    return list
  }, [configManager.config?.apps, localAppOrder, searchQuery, sortBy])

  // Group into sections for recent sorting
  const RECENT_DAYS = 14
  const groupedApps = useMemo(() => {
    if (sortBy !== 'recent') return null
    const sections: { id: string; title: string; items: AppConfig[] }[] = []
    const now = new Date()
    const byRecent = [...filteredApps].sort((a, b) => (b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0) - (a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0))

    const recentCutoff = new Date(now)
    recentCutoff.setDate(now.getDate() - RECENT_DAYS)

    const recent: AppConfig[] = []
    const byMonth: Record<string, AppConfig[]> = {}
    const byYear: Record<string, AppConfig[]> = {}

    for (const app of byRecent) {
      const ts = app.lastUsedAt ? new Date(app.lastUsedAt) : null
      if (!ts) continue
      if (ts >= recentCutoff) {
        recent.push(app)
        continue
      }
      const y = ts.getFullYear()
      const m = ts.toLocaleString(undefined, { month: 'long' }).toUpperCase()
      if (y === now.getFullYear()) {
        const key = `${y}-${m}`
        byMonth[key] ||= []
        byMonth[key].push(app)
      } else {
        const key = `${y}`
        byYear[key] ||= []
        byYear[key].push(app)
      }
    }

    if (recent.length) sections.push({ id: 'recent', title: 'RECENT', items: recent })

    // Months of current year, in calendar order descending
    const monthOrder = [...Array(12).keys()].map(i => new Date(now.getFullYear(), i, 1).toLocaleString(undefined, { month: 'long' }).toUpperCase())
    for (let i = monthOrder.length - 1; i >= 0; i--) {
      const m = monthOrder[i]
      const key = `${now.getFullYear()}-${m}`
      if (byMonth[key]?.length) sections.push({ id: key, title: m, items: byMonth[key] })
    }

    // Older years descending
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
    for (const y of years) {
      const key = `${y}`
      sections.push({ id: key, title: `${y}`, items: byYear[key] })
    }

    return sections
  }, [filteredApps, sortBy])

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

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

  // Empty state (no apps configured at all)
  const totalApps = configManager.config?.apps?.length || 0
  if (totalApps === 0) {
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
          <div className="sidebar-filters compact">
            <button
              className="sort-toggle"
              onClick={() => setSortBy(prev => prev === 'recent' ? 'az' : 'recent')}
              title={sortBy === 'recent' ? 'Sorting: Recents (click for A–Z)' : 'Sorting: A–Z (click for Recents)'}
            >
              {sortBy === 'recent' ? <Clock size={16} /> : <ArrowDownAZ size={16} />}
            </button>
          </div>
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

  // No results for current filters/search
  if (filteredApps.length === 0) {
    const isSearch = !!searchQuery.trim()
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
          <div className="sidebar-filters compact">
            <button
              className="sort-toggle"
              onClick={() => setSortBy(prev => prev === 'recent' ? 'az' : 'recent')}
              title={sortBy === 'recent' ? 'Sorting: Recents (click for A–Z)' : 'Sorting: A–Z (click for Recents)'}
            >
              {sortBy === 'recent' ? <Clock size={16} /> : <ArrowDownAZ size={16} />}
            </button>
          </div>
        </div>
    {isSearch ? (
          <div className="no-results-state">
            <div className="no-results-icon">
              <Search size={48} />
            </div>
            <h3>No results for ‘{searchQuery}’</h3>
            <p>Try adjusting your search or clear it.</p>
            <button className="add-app-button" onClick={() => setSearchQuery('')}>Clear search</button>
          </div>
        ) : (
          <div className="no-results-state">
            <div className="no-results-icon">
              <Search size={48} />
            </div>
      <h3>No apps match current view</h3>
      <p>Try switching sort modes or add a new app.</p>
          </div>
        )}
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
        <div className="sidebar-filters compact">
          <button
            className="sort-toggle"
            onClick={() => setSortBy(prev => prev === 'recent' ? 'az' : 'recent')}
            title={sortBy === 'recent' ? 'Sorting: Recents (click for A–Z)' : 'Sorting: A–Z (click for Recents)'}
          >
            {sortBy === 'recent' ? <Clock size={16} /> : <ArrowDownAZ size={16} />}
          </button>
        </div>
      </div>

      <div className="app-list">
        {sortBy === 'recent' && groupedApps ? (
          // Grouped by recents
          groupedApps.map(section => (
            <div key={section.id} className={`section ${collapsedSections[section.id] ? 'collapsed' : ''}`}>
              <button className="section-header" onClick={() => toggleSection(section.id)} title="Collapse/Expand">
                <span className="section-title">{section.title}</span>
                <span className="section-count">{section.items.length}</span>
              </button>
              {!collapsedSections[section.id] && (
                <div className="section-items">
                  {(searchQuery.trim() ? section.items : section.items).map(app => (
                    <AppListItem
                      key={app.id}
                      app={app}
                      isSelected={selectedAppId === app.id}
                      onClick={handleAppClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : searchQuery.trim() ? (
          filteredApps.map((app) => (
            <AppListItem
              key={app.id}
              app={app}
              isSelected={selectedAppId === app.id}
              onClick={handleAppClick}
            />
          ))
        ) : (
          // When not searching, enable drag and drop reordering (only in A–Z mode)
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
