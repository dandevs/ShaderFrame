import { createFileRoute, Link } from '@tanstack/react-router'
import '../App.css'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ShaderFrame</h1>
      </header>
      <main className="app-main">
        <p>Welcome to ShaderFrame - Your AI-powered image editor</p>
        <p>Built with Electron, React, and React Three Fiber</p>
        
        <div style={{ marginTop: '20px' }}>
          <Link to="/editor-test-bed">
            <button style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
              Go To Test Bed
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
