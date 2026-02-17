import React from 'react'
import './App.css'

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ShaderFrame</h1>
      </header>
      <main className="app-main">
        <p>Welcome to ShaderFrame - Your AI-powered image editor</p>
        <p>Built with Electron, React, React Three Fiber, and Fabric.js</p>
      </main>
    </div>
  )
}

export default App
