import type { GlobalConfig } from '../../types'
import type { useConfigManager } from '../../hooks/useConfig'
import './GeneralSettingsTab.css'

interface GeneralSettingsTabProps {
  config: GlobalConfig
  configManager: ReturnType<typeof useConfigManager>
  onSettingsChange: () => void
}

export function GeneralSettingsTab({ config, configManager, onSettingsChange }: GeneralSettingsTabProps) {
  const handleThemeChange = async (theme: 'dark') => {
    try {
      await configManager.updateSettings({ theme })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  const handleWorkingDirectoryChange = async (value: string) => {
    try {
      await configManager.updateSettings({
        defaultWorkingDirectory: value || undefined
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update working directory:', error)
    }
  }

  const handleTerminalLinesChange = async (value: number) => {
    try {
      await configManager.updateSettings({ maxTerminalLines: value })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update terminal lines:', error)
    }
  }

  const handleBrowserChange = async (value: string) => {
    try {
      await configManager.updateSettings({
        defaultBrowser: value || undefined
      })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update browser:', error)
    }
  }

  const handleAutoSaveChange = async (autoSave: boolean) => {
    try {
      await configManager.updateSettings({ autoSave })
      onSettingsChange()
    } catch (error) {
      console.error('Failed to update auto-save:', error)
    }
  }

  return (
    <div className="general-settings-tab">
      <h3 className="settings-section-title">General Settings</h3>

      <div className="settings-section">
        <div className="setting-item">
          <label className="setting-label">Theme</label>
          <select
            className="setting-input"
            value={config.settings.theme}
            onChange={(e) => handleThemeChange(e.target.value as 'dark')}
          >
            <option value="dark">Dark</option>
          </select>
          <p className="setting-description">
            Choose the appearance theme for the application
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">Default Working Directory</label>
          <input
            type="text"
            className="setting-input"
            value={config.settings.defaultWorkingDirectory || ''}
            onChange={(e) => handleWorkingDirectoryChange(e.target.value)}
            placeholder="e.g., /home/user/projects"
          />
          <p className="setting-description">
            Default directory for new launchers (leave empty for user home)
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">Terminal Output Lines</label>
          <input
            type="number"
            className="setting-input"
            value={config.settings.maxTerminalLines}
            onChange={(e) => handleTerminalLinesChange(parseInt(e.target.value) || 1000)}
            min="100"
            max="10000"
            step="100"
          />
          <p className="setting-description">
            Maximum number of lines to keep in terminal output buffer
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">Default Browser</label>
          <input
            type="text"
            className="setting-input"
            value={config.settings.defaultBrowser || ''}
            onChange={(e) => handleBrowserChange(e.target.value)}
            placeholder="e.g., firefox, chrome (leave empty for system default)"
          />
          <p className="setting-description">
            Browser command to use for opening URLs (leave empty for system default)
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox-label">
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={config.settings.autoSave}
              onChange={(e) => handleAutoSaveChange(e.target.checked)}
            />
            Auto-save configuration changes
          </label>
          <p className="setting-description">
            Automatically save configuration changes without confirmation
          </p>
        </div>
      </div>
    </div>
  )
}
