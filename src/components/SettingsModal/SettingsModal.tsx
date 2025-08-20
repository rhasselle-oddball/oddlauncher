import { useState } from 'react'
import { X } from 'lucide-react'
import { GeneralSettingsTab } from './GeneralSettingsTab'
import { TerminalSettingsTab } from './TerminalSettingsTab'
import { useConfigManager } from '../../hooks/useConfig'
import './SettingsModal.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'general' | 'terminal'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const configManager = useConfigManager()

  if (!isOpen || !configManager.config) {
    return null
  }

  const handleSettingsChange = () => {
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    // Save logic will be handled by individual tabs
    // For now, just close the modal
    setHasUnsavedChanges(false)
    onClose()
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmed) return
    }
    setHasUnsavedChanges(false)
    onClose()
  }

  const handleResetToDefaults = () => {
    const confirmed = window.confirm('Reset all settings to defaults? This cannot be undone.')
    if (confirmed) {
      // Reset logic will be implemented
      setHasUnsavedChanges(true)
    }
  }

  return (
    <div className="settings-modal-overlay" onClick={handleCancel}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
          <button
            className="settings-modal-close"
            onClick={handleCancel}
            title="Close Settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              📁 General
            </button>
            <button
              className={`settings-tab ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveTab('terminal')}
            >
              🖥️ Terminal
            </button>
          </div>

          <div className="settings-tab-content">
            {activeTab === 'general' && (
              <GeneralSettingsTab
                config={configManager.config}
                configManager={configManager}
                onSettingsChange={handleSettingsChange}
              />
            )}
            {activeTab === 'terminal' && (
              <TerminalSettingsTab
                config={configManager.config}
                configManager={configManager}
                onSettingsChange={handleSettingsChange}
              />
            )}
          </div>
        </div>

        <div className="settings-modal-footer">
          <button
            className="settings-button secondary"
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </button>
          <div className="settings-actions">
            <button
              className="settings-button secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="settings-button primary"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
