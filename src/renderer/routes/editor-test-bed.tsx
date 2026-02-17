import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Viewport } from '../components/Editor/Viewport'
import { Inspector } from '../components/Editor/Inspector'

export const Route = createFileRoute('/editor-test-bed')({
  component: EditorTestBed,
})

function EditorTestBed() {
  return (
    <div style={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#111'
    }}>
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        <Viewport />
        
        {/* Overlay back button */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
          <Link 
            to="/" 
            style={{ 
              background: 'rgba(0,0,0,0.5)', 
              color: 'white', 
              padding: '8px 12px', 
              borderRadius: '4px',
              textDecoration: 'none',
              backdropFilter: 'blur(4px)',
              fontFamily: 'sans-serif'
            }}
          >
            ← Back
          </Link>
        </div>
      </div>
      
      <Inspector />
    </div>
  )
}
