import { Library, Settings } from 'lucide-react'
import './ActivityBar.css'

export type ActivityBarView = 'library' | 'settings'

interface ActivityBarProps {
  activeView: ActivityBarView
  onViewChange: (view: ActivityBarView) => void
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <div className="activity-bar">
      <div className="activity-bar-icons">
        <button
          className={`activity-bar-icon ${activeView === 'library' ? 'active' : ''}`}
          onClick={() => onViewChange('library')}
          title="Library"
        >
          <Library size={24} />
        </button>
      </div>
      
      <div className="activity-bar-bottom">
        <button
          className={`activity-bar-icon ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
          title="Settings"
        >
          <Settings size={24} />
        </button>
      </div>
    </div>
  )
}
