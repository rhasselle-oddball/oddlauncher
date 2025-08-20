import { useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsModal } from '../SettingsModal'
import './SettingsPanel.css'

export function SettingsPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="settings-panel">
        <div className="settings-panel-header">
          <h2 className="settings-panel-title">Settings</h2>
        </div>
        <div className="settings-panel-content">
          <div className="settings-overview">
            <p className="settings-description">
              Configure global application and terminal settings.
            </p>
            <button 
              className="open-settings-button"
              onClick={() => setIsModalOpen(true)}
            >
              <Settings size={20} />
              Open Settings
            </button>
          </div>
          
          <div className="settings-quick-info">
            <h3>Quick Access</h3>
            <ul>
              <li>Configure default shell and source files</li>
              <li>Set environment variables</li>
              <li>Customize terminal behavior</li>
              <li>Adjust general preferences</li>
            </ul>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
