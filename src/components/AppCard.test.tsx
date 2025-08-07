import React from 'react'
import { AppCard } from './AppCard'
import type { AppState } from '../types'

/**
 * Test utility to verify AppCard component renders correctly
 * This demonstrates proper usage of the AppCard component
 */

// Sample test data
const testAppState: AppState = {
  config: {
    id: 'test-app-1',
    name: 'Test Application',
    launchCommands: 'npm start',
    workingDirectory: '/home/user/test-app',
    url: 'http://localhost:3000',
    tags: ['Test', 'Development'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  process: {
    appId: 'test-app-1',
    status: 'running',
    startedAt: new Date().toISOString(),
    output: ['Starting application...', 'App started successfully'],
    pid: 12345,
  },
}

const stoppedAppState: AppState = {
  config: {
    id: 'test-app-2',
    name: 'Stopped Application',
    launchCommands: 'python server.py',
    workingDirectory: '/home/user/python-app',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  process: {
    appId: 'test-app-2',
    status: 'stopped',
    output: [],
  },
}

const errorAppState: AppState = {
  config: {
    id: 'test-app-3',
    name: 'Error Application',
    launchCommands: 'invalid-command',
    workingDirectory: '/home/user/error-app',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  process: {
    appId: 'test-app-3',
    status: 'error',
    errorMessage: 'Command not found: invalid-command',
    output: ['Error: Command not found'],
  },
}

/**
 * Test component that renders different AppCard states
 */
export const AppCardTest: React.FC = () => {
  const handleStart = (appId: string) => {
    console.log('Start requested for app:', appId)
  }

  const handleStop = (appId: string) => {
    console.log('Stop requested for app:', appId)
  }

  const handleEdit = (appId: string) => {
    console.log('Edit requested for app:', appId)
  }

  const handleDelete = (appId: string) => {
    console.log('Delete requested for app:', appId)
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
      <AppCard
        appState={testAppState}
        onStart={handleStart}
        onStop={handleStop}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <AppCard
        appState={stoppedAppState}
        onStart={handleStart}
        onStop={handleStop}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <AppCard
        appState={errorAppState}
        onStart={handleStart}
        onStop={handleStop}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
