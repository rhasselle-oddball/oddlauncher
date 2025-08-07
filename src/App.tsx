import { useState, useEffect } from 'react'
import { useConfigManager } from './hooks/useConfig'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useProcessManager } from './hooks/useProcessManager'
import { AppLayout, LibrarySidebar, MainContent, AppConfigModal, ConfirmationModal } from './components'
import type { AppConfig } from './types'
import type { AppConfigModalMode } from './components/AppConfigModal'
import {
  parseImportData,
  validateAppConfig,
  generateUniqueName,
  createFileInput,
  readFileAsText
} from './utils/import-export'
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    app?: AppConfig
  }>({
    isOpen: false,
  })
  const configManager = useConfigManager()
  const { processes } = useProcessManager()

  // Update selectedApp when config changes (for title updates)
  useEffect(() => {
    if (selectedApp && configManager.config) {
      const updatedApp = configManager.config.apps.find(app => app.id === selectedApp.id)
      if (updatedApp && JSON.stringify(updatedApp) !== JSON.stringify(selectedApp)) {
        setSelectedApp(updatedApp)
      }
    }
  }, [configManager.config, selectedApp])

  // Keyboard shortcuts handlers
  const handleKeyboardStartStop = async () => {
    if (!selectedApp) return

    const process = processes[selectedApp.id]
    if (process?.status === 'running') {
      // Stop the process
      console.log('Keyboard shortcut: Stopping app', selectedApp.name)
      // The actual stop logic is handled in the MainAppHeader component
    } else {
      // Start the process
      console.log('Keyboard shortcut: Starting app', selectedApp.name)
      // The actual start logic is handled in the MainAppHeader component
    }
  }

  const handleKeyboardDelete = () => {
    if (selectedApp) {
      handleDelete(selectedApp)
    }
  }

  const handleKeyboardDuplicate = () => {
    if (selectedApp) {
      handleDuplicate(selectedApp)
    }
  }

  const handleKeyboardEdit = () => {
    if (selectedApp) {
      handleEdit(selectedApp)
    }
  }

  const handleKeyboardExport = () => {
    if (selectedApp) {
      handleExportApp(selectedApp)
    }
  }

  const handleKeyboardEscape = () => {
    if (modalState.isOpen) {
      handleCloseModal()
    } else if (deleteConfirmation.isOpen) {
      handleDeleteCancel()
    } else {
      setSelectedApp(null) // Clear selection
    }
  }

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
    setDeleteConfirmation({
      isOpen: true,
      app,
    })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.app) {
      try {
        const success = await configManager.removeApp(deleteConfirmation.app.id)
        if (success) {
          // Clear selection if we deleted the selected app
          if (selectedApp?.id === deleteConfirmation.app.id) {
            setSelectedApp(null)
          }
        }
      } catch (error) {
        console.error('Failed to delete app:', error)
      }
    }
    setDeleteConfirmation({ isOpen: false })
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false })
  }

  const handleDuplicate = async (app: AppConfig) => {
    try {
      const success = await configManager.duplicateApp(app.id)
      if (success) {
        // Optionally select the duplicated app (it will be the last one in the list)
        console.log('App duplicated successfully:', app.name)
      }
    } catch (error) {
      console.error('Failed to duplicate app:', error)
    }
  }

  const handleExportApp = (app: AppConfig) => {
    // Export is handled directly in the MainAppHeader component
    console.log('App exported successfully:', app.name)
  }

  const handleImportApp = async () => {
    try {
      const fileInput = createFileInput(async (file) => {
        try {
          const fileContent = await readFileAsText(file)
          const parseResult = parseImportData(fileContent)

          if (!parseResult.success) {
            alert(`Import failed: ${parseResult.error}`)
            return
          }

          const exportData = parseResult.data!

          if (exportData.type === 'single-app') {
            const importedApp = exportData.data as AppConfig

            if (!validateAppConfig(importedApp)) {
              alert('Import failed: Invalid app configuration format.')
              return
            }

            // Check for name conflicts and generate unique name if needed
            const existingNames = configManager.config?.apps.map((app: AppConfig) => app.name) || []
            if (existingNames.includes(importedApp.name)) {
              importedApp.name = generateUniqueName(importedApp.name, existingNames)
            }

            // Update timestamps and regenerate ID
            importedApp.id = crypto.randomUUID()
            importedApp.createdAt = new Date().toISOString()
            importedApp.updatedAt = new Date().toISOString()

            // Add the imported app
            const success = await configManager.addApp(importedApp)
            if (success) {
              alert(`App imported successfully as "${importedApp.name}"`)
            } else {
              alert('Failed to import app. Please try again.')
            }
          } else {
            alert('Full configuration import is not yet supported. Please import individual apps.')
          }
        } catch (error) {
          console.error('Import error:', error)
          alert('Failed to import app. Please check the file format and try again.')
        } finally {
          // Clean up the file input
          document.body.removeChild(fileInput)
        }
      })

      fileInput.click()
    } catch (error) {
      console.error('Failed to create file input:', error)
      alert('Failed to open file dialog. Please try again.')
    }
  }

  const handleOpenUrl = (app: AppConfig) => {
    // URL opening is handled directly in MainAppHeader component
    // This callback is kept for compatibility but the actual opening
    // happens in MainAppHeader using the useBrowser hook
    console.log('Open URL requested for app:', app.name, app.url)
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
          // Update selected app with the new data from config
          // This ensures sidebar and main header are both updated
          if (selectedApp?.id === appConfig.id) {
            // Get the updated app from the config to ensure consistency
            const updatedApp = configManager.getAppById(appConfig.id)
            setSelectedApp(updatedApp || appConfig)
          }
        }
      }

      return success
    } catch (error) {
      console.error('Failed to save app config:', error)
      return false
    }
  }

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    selectedApp,
    onStartStop: handleKeyboardStartStop,
    onDelete: handleKeyboardDelete,
    onDuplicate: handleKeyboardDuplicate,
    onEdit: handleKeyboardEdit,
    onAddNew: handleAddApp,
    onImport: handleImportApp,
    onExport: handleKeyboardExport,
    onEscape: handleKeyboardEscape,
    disabled: modalState.isOpen || deleteConfirmation.isOpen,
  })

  return (
    <div className="app">
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
            onDuplicate={handleDuplicate}
            onExportApp={handleExportApp}
            onImportApp={handleImportApp}
            onOpenUrl={handleOpenUrl}
            onOpenDirectory={handleOpenDirectory}
          />
        }
      />

      {/* App Configuration Modal */}
      <AppConfigModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        appToEdit={modalState.appToEdit}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete App"
        message={`Are you sure you want to delete "${deleteConfirmation.app?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        app={deleteConfirmation.app}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default App
