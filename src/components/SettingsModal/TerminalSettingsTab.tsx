import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { GlobalConfig } from '../../types'
import type { useConfigManager } from '../../hooks/useConfig'
import { detectDefaultTerminalSettings } from '../../utils/app-data'
import './TerminalSettingsTab.css'

interface TerminalSettingsTabProps {
  config: GlobalConfig
  configManager: ReturnType<typeof useConfigManager>
  onSettingsChange: () => void
}

export function TerminalSettingsTab({ config, configManager, onSettingsChange }: TerminalSettingsTabProps) {
  const [newSourceFile, setNewSourceFile] = useState('')
  const [newEnvVarKey, setNewEnvVarKey] = useState('')
  const [newEnvVarValue, setNewEnvVarValue] = useState('')

  const terminalSettings = config.settings.terminal

  const handleShellChange = async (shell: string) => {
    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          defaultShell: shell,
        }
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update shell:', error)
    }
  }

  const handleLoginShellChange = async (useLoginShell: boolean) => {
    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          useLoginShell,
        }
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update login shell setting:', error)
    }
  }

  const handleInheritEnvironmentChange = async (inheritEnvironment: boolean) => {
    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          inheritEnvironment,
        }
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update inherit environment setting:', error)
    }
  }

  const handleAddSourceFile = async () => {
    if (!newSourceFile.trim()) return

    const updatedSourceFiles = [...terminalSettings.defaultSourceFiles, newSourceFile.trim()]

    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          defaultSourceFiles: updatedSourceFiles,
        }
      })
      setNewSourceFile('')
      onSettingsChange()
    } catch (error) {
      console.error('Failed to add source file:', error)
    }
  }

  const handleRemoveSourceFile = async (index: number) => {
    const updatedSourceFiles = terminalSettings.defaultSourceFiles.filter((_, i) => i !== index)

    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          defaultSourceFiles: updatedSourceFiles,
        }
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to remove source file:', error)
    }
  }

  const handleAddEnvironmentVariable = async () => {
    if (!newEnvVarKey.trim() || !newEnvVarValue.trim()) return

    const updatedEnvVars = {
      ...terminalSettings.defaultEnvironmentVariables,
      [newEnvVarKey.trim()]: newEnvVarValue.trim()
    }

    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          defaultEnvironmentVariables: updatedEnvVars,
        }
      })
      setNewEnvVarKey('')
      setNewEnvVarValue('')
      onSettingsChange()
    } catch (error) {
      console.error('Failed to add environment variable:', error)
    }
  }

  const handleRemoveEnvironmentVariable = async (key: string) => {
    const updatedEnvVars = { ...terminalSettings.defaultEnvironmentVariables }
    delete updatedEnvVars[key]

    try {
      await configManager.updateSettings({
        terminal: {
          ...terminalSettings,
          defaultEnvironmentVariables: updatedEnvVars,
        }
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to remove environment variable:', error)
    }
  }

  const handleResetToDefaults = async () => {
    const confirmed = window.confirm('Reset terminal settings to defaults? This will detect your shell and set common source files.')
    if (!confirmed) return

    const defaultSettings = detectDefaultTerminalSettings()

    try {
      await configManager.updateSettings({
        terminal: defaultSettings,
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to reset terminal settings:', error)
    }
  }

  return (
    <div className="terminal-settings-tab">
      <div className="settings-header">
        <h3 className="settings-section-title">Terminal Settings</h3>
        <button
          className="reset-button"
          onClick={handleResetToDefaults}
          title="Reset to detected defaults"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="settings-section">
        <div className="setting-item">
          <label className="setting-label">Default Shell</label>
          <select
            className="setting-input"
            value={terminalSettings.defaultShell}
            onChange={(e) => handleShellChange(e.target.value)}
          >
            <option value="zsh">Zsh</option>
            <option value="bash">Bash</option>
            <option value="fish">Fish</option>
            <option value="sh">Sh</option>
          </select>
          <p className="setting-description">
            Default shell for executing launcher commands
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox-label">
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={terminalSettings.useLoginShell}
              onChange={(e) => handleLoginShellChange(e.target.checked)}
            />
            Use Login Shell
          </label>
          <p className="setting-description">
            Run shell with login flag (-l) to load profile files automatically
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox-label">
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={terminalSettings.inheritEnvironment}
              onChange={(e) => handleInheritEnvironmentChange(e.target.checked)}
            />
            Inherit Current Environment
          </label>
          <p className="setting-description">
            Include current process environment variables in spawned processes
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">Default Source Files</label>
          <div className="list-container">
            {terminalSettings.defaultSourceFiles.map((file, index) => (
              <div key={index} className="list-item">
                <span className="list-item-text">{file}</span>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveSourceFile(index)}
                  title={`Remove ${file}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="add-item">
              <input
                type="text"
                className="add-input"
                value={newSourceFile}
                onChange={(e) => setNewSourceFile(e.target.value)}
                placeholder="e.g., ~/.zshrc, ~/.profile"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSourceFile()}
              />
              <button
                className="add-button"
                onClick={handleAddSourceFile}
                disabled={!newSourceFile.trim()}
                title="Add source file"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <p className="setting-description">
            Files to source before running commands (e.g., ~/.zshrc, ~/.profile)
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">Default Environment Variables</label>
          <div className="list-container">
            {Object.entries(terminalSettings.defaultEnvironmentVariables).map(([key, value]) => (
              <div key={key} className="list-item env-var">
                <span className="env-var-key">{key}</span>
                <span className="env-var-equals">=</span>
                <span className="env-var-value">{value}</span>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveEnvironmentVariable(key)}
                  title={`Remove ${key}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="add-item env-var-add">
              <input
                type="text"
                className="add-input env-var-key-input"
                value={newEnvVarKey}
                onChange={(e) => setNewEnvVarKey(e.target.value)}
                placeholder="Variable name"
                onKeyPress={(e) => e.key === 'Enter' && newEnvVarValue.trim() && handleAddEnvironmentVariable()}
              />
              <span className="env-var-equals">=</span>
              <input
                type="text"
                className="add-input env-var-value-input"
                value={newEnvVarValue}
                onChange={(e) => setNewEnvVarValue(e.target.value)}
                placeholder="Value"
                onKeyPress={(e) => e.key === 'Enter' && newEnvVarKey.trim() && handleAddEnvironmentVariable()}
              />
              <button
                className="add-button"
                onClick={handleAddEnvironmentVariable}
                disabled={!newEnvVarKey.trim() || !newEnvVarValue.trim()}
                title="Add environment variable"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <p className="setting-description">
            Environment variables to set for all launcher commands
          </p>
        </div>
      </div>
    </div>
  )
}
