import { useState } from 'react'
import { useConfigManager } from './hooks/useConfig'
import { generateAppId } from './utils/app-data'
import { AppLayout, PlaceholderSidebar, PlaceholderMainContent } from './components'
import type { AppConfig } from './types'
import './styles/App.css'

function App() {
  const [count, setCount] = useState(0)
  const configManager = useConfigManager()

  const testAddApp = async () => {
    const newApp: AppConfig = {
      id: generateAppId(),
      name: 'Test App',
      launchCommands: 'echo "Hello World"',
      workingDirectory: '/tmp',
      url: 'http://localhost:3000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const success = await configManager.addApp(newApp)
    if (success) {
      console.log('App added successfully!')
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
        <h1>🎛️ Oddbox</h1>
        <p>Your Steam Library for Dev Tools</p>

        {/* Temporary test buttons - will be removed in final version */}
        <div className="test-buttons">
          <button
            className="test-button"
            onClick={() => setCount((count) => count + 1)}
          >
            Test Button: {count}
          </button>

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
            <p>Last modified: {configManager.config.lastModified}</p>
          </div>
        )}
      </header>

      <main className="main-layout">
        <AppLayout
          sidebar={<PlaceholderSidebar />}
          mainContent={<PlaceholderMainContent />}
        />
      </main>
    </div>
  )
}

export default App
