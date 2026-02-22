import { Viewport } from './Viewport'

interface Props {
  onBack: () => void
}

export function EditorTestBed({ onBack }: Props): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>
      <div style={{ padding: '8px 12px', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <button onClick={onBack} style={{ cursor: 'pointer' }}>
          ← Back
        </button>
        <span style={{ marginLeft: 12, color: '#aaa', fontSize: 13 }}>
          EditorTestBed – Viewport
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <Viewport />
      </div>
    </div>
  )
}
