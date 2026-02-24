import { observer } from 'mobx-react-lite'
import { EditorState } from './EditorTestBed'

export const Hierarchy = observer((props: { state: EditorState }) => {
  const { rootLayer, selectedLayer } = props.state

  return (
    <div
      style={{
        width: '220px',
        flexShrink: 0,
        height: '100%',
        background: '#111',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#bbb', fontSize: 12, letterSpacing: 0.5 }}>Hierarchy</span>
        <button
          onClick={() => props.state.createLayer()}
          style={{
            cursor: 'pointer',
            fontSize: 12,
            padding: '2px 6px',
            background: '#202020',
            color: '#ddd',
            border: '1px solid #333',
            borderRadius: 4,
          }}
        >
          + Layer
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rootLayer.children.map((layer, index) => {
          const isSelected = selectedLayer === layer

          return (
            <button
              key={index}
              onClick={() => props.state.selectLayer(layer)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '6px 10px',
                background: isSelected ? '#2a2a2a' : 'transparent',
                color: isSelected ? '#ffd54f' : '#bbb',
                border: 'none',
                borderBottom: '1px solid #1f1f1f',
                cursor: 'pointer',
              }}
            >
              Layer {index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
})
