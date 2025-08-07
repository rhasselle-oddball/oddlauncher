import { Settings } from 'lucide-react'
import { useState } from 'react'
import { useConfigManager } from './hooks/useConfig'
import { generateAppId } from './utils/app-data'
import { AppLayout, LibrarySidebar, MainContent, AppConfigModal } from './components'
import type { AppConfig } from './types'
import type { AppConfigModalMode } from './components/AppConfigModal'
import './styles/App.css'

function App() {
  const [selectedApp, setSelectedApp] = useState<AppConfig | null>(null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: AppConfigModalMode
    appToEdit?: AppConfig
  }>({
    isOpen: false,
    mode: 'add',
  })
  const configManager = useConfigManager()

  const handleAppSelect = (app: AppConfig | null) => {
    setSelectedApp(app)
  }

  const handleAddApp = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
    })
  }

  const handleEdit = (app: AppConfig) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      appToEdit: app,
    })
  }

  const handleDelete = (app: AppConfig) => {
    // TODO: Implement delete with confirmation in Phase 4
    console.log('Delete clicked for app:', app.name)
  }

  const handleOpenUrl = (app: AppConfig) => {
    if (app.url) {
      // TODO: Implement URL opening in Phase 3
      console.log('Open URL clicked for app:', app.name, app.url)
    }
  }

  const handleOpenDirectory = (app: AppConfig) => {
    if (app.workingDirectory) {
      // TODO: Implement directory opening in Phase 3
      console.log('Open directory clicked for app:', app.name, app.workingDirectory)
    }
  }

  // Modal handlers
  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const handleModalSubmit = async (appConfig: AppConfig) => {
    try {
      let success = false

      if (modalState.mode === 'add') {
        success = await configManager.addApp(appConfig)
        if (success) {
          // Auto-select the newly added app
          setSelectedApp(appConfig)
        }
      } else if (modalState.mode === 'edit') {
        success = await configManager.updateApp(appConfig)
        if (success) {
          // Update selected app if it's the one being edited
          if (selectedApp?.id === appConfig.id) {
            setSelectedApp(appConfig)
          }
        }
      }

      return success
    } catch (error) {
      console.error('Failed to save app config:', error)
      return false
    }
  }

  const testAddApp = async () => {
    const newApp: AppConfig = {
      id: generateAppId(),
      name: 'Test App',
      command: 'echo "Hello World"',
      workingDirectory: '/tmp',
      url: 'http://localhost:3000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const success = await configManager.addApp(newApp)
    if (success) {
      console.log('App added successfully!')
      // Auto-select the newly added app
      setSelectedApp(newApp)
    } else {
      console.error('Failed to add app:', configManager.error)
    }
  }

  const testConfigInfo = async () => {
    const info = await configManager.getConfigInfo()
    console.log('Configuration info:', info)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <Settings size={24} style={{ marginRight: '0.5rem' }} />
          Oddbox
        </h1>
        <p>Your Steam Library for Dev Tools</p>

        {/* Temporary test buttons - will be removed in final version */}
        <div className="test-buttons">
          <button
            className="test-button"
            onClick={testAddApp}
            disabled={configManager.isLoading || configManager.isOperating}
          >
            Test Add App
          </button>

          <button
            className="test-button"
            onClick={testConfigInfo}
          >
            Test Config Info
          </button>
        </div>

        {configManager.isLoading && <p>Loading configuration...</p>}
        {configManager.error && (
          <p className="error">Error: {configManager.error.message}</p>
        )}
        {configManager.config && (
          <div className="config-info">
            <p>Apps configured: {configManager.config.apps.length}</p>
            {selectedApp && <p>Selected: {selectedApp.name}</p>}
            <p>Last modified: {configManager.config.lastModified}</p>
          </div>
        )}
      </header>

      <main className="main-layout">
        <AppLayout
          sidebar={
            <LibrarySidebar
              selectedAppId={selectedApp?.id || null}
              onAppSelect={handleAppSelect}
              onAddApp={handleAddApp}
            />
          }
          mainContent={
            <MainContent
              selectedApp={selectedApp}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenUrl={handleOpenUrl}
              onOpenDirectory={handleOpenDirectory}
            />
          }
        />
      </main>

      {/* App Configuration Modal */}
      <AppConfigModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        appToEdit={modalState.appToEdit}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}

export default App
