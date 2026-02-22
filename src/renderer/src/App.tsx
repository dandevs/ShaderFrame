import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useState } from 'react'
import { EditorTestBed } from './components/EditorTestBed/EditorTestBed'

function App(): React.JSX.Element {
  const [showTestBed, setShowTestBed] = useState(false)
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  if (showTestBed) {
    return <EditorTestBed onBack={() => setShowTestBed(false)} />
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
        <div className="action">
          <a onClick={() => setShowTestBed(true)} style={{ cursor: 'pointer' }}>
            Editor TestBed
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
