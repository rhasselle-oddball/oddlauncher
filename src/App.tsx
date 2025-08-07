import { useState } from 'react'
import './styles/App.css'

function App() {
  const [count, setCount] = useState(0)

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
          <button
            className="test-button"
            onClick={() => setCount((count) => count + 1)}
          >
            Test Button: {count}
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
