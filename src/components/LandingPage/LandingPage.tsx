import { Plus } from 'lucide-react'
import './LandingPage.css'

interface LandingPageProps {
  onAddLauncher: () => void
}

export function LandingPage({ onAddLauncher }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-logo">
          <div className="logo-icon">
            <img
              src="/logo.svg"
              alt="OddLauncher Logo"
              className="logo-image"
            />
          </div>
          <h1 className="landing-title">OddLauncher</h1>
          <p className="landing-subtitle">Dev Tools Launcher</p>
        </div>

        <div className="landing-actions">
          <p className="landing-message">
            Select a launcher from the sidebar or create a new one to get started
          </p>

          <button className="landing-add-button" onClick={onAddLauncher}>
            <Plus size={20} />
            Add New Launcher
          </button>
        </div>
      </div>
    </div>
  )
}
