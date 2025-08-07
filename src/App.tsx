import { useState } from 'react'
import { useConfigManager } from './hooks/useConfig'
import { generateAppId } from './utils/app-data'
import { AppCard } from './components'
import type { AppConfig, AppState } from './types'
import './styles/App.css'

function App() {
  const [count, setCount] = useState(0)
  const configManager = useConfigManager()

  // Sample app data for testing the AppCard component
  const sampleApps: AppState[] = [
    {
      config: {
        id: '1',
        name: 'React Dev Server',
        command: 'npm run dev',
        workingDirectory: '/home/user/my-react-app',
        url: 'http://localhost:3000',
        tags: ['React', 'Frontend'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      process: {
        appId: '1',
        status: 'running',
        startedAt: new Date().toISOString(),
        output: [],
        pid: 12345,
      },
    },
    {
      config: {
        id: '2',
        name: 'API Server',
        command: 'npm run server',
        workingDirectory: '/home/user/my-api',
        url: 'http://localhost:8080',
        tags: ['Node.js', 'Backend', 'API'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      process: {
        appId: '2',
        status: 'stopped',
        output: [],
      },
    },
    {
      config: {
        id: '3',
        name: 'Database',
        command: 'docker-compose up postgres',
        workingDirectory: '/home/user/my-project',
        tags: ['Database', 'Docker'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      process: {
        appId: '3',
        status: 'starting',
        startedAt: new Date().toISOString(),
        output: [],
      },
    },
    {
      config: {
        id: '4',
        name: 'Long App Name That Should Be Truncated',
        command: 'python -m http.server 8000',
        workingDirectory: '/home/user/python-project',
        url: 'http://localhost:8000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      process: {
        appId: '4',
        status: 'error',
        errorMessage: 'Port 8000 is already in use',
        output: [],
      },
    },
  ]

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
      </header>

      <main className="main-content">
        <div className="welcome-section">
          <h2>Welcome to Oddbox!</h2>
          <p>Click-to-run launcher for your development tools</p>

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
        </div>

        {/* App Cards Demo Section */}
        <div className="app-cards-demo">
          <h3>App Cards Demo</h3>
          <div className="app-cards-grid">
            {sampleApps.map((appState) => (
              <AppCard
                key={appState.config.id}
                appState={appState}
                onStart={(id) => console.log('Start app:', id)}
                onStop={(id) => console.log('Stop app:', id)}
                onEdit={(id) => console.log('Edit app:', id)}
                onDelete={(id) => console.log('Delete app:', id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
