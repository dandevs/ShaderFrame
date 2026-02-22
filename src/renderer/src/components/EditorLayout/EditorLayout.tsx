import { observer } from 'mobx-react-lite'
import { useUIStore } from '@renderer/providers/StoreProvider'
import { Toolbar } from '@renderer/components/Toolbar'
import { LayerPanel } from '@renderer/components/LayerPanel'
import { Viewport } from '@renderer/components/Viewport'
import { Inspector } from '@renderer/components/Inspector'
import { PromptChat } from '@renderer/components/PromptChat'

/**
 * EditorLayout — CSS Grid layout composing all editor panels.
 *
 * Layout:
 * ┌─────────────────────────────────────────┐
 * │              Toolbar (top)              │
 * ├──────┬──────────────────────┬───────────┤
 * │      │                      │           │
 * │ Left │      Viewport        │  Right    │
 * │Panel │      (center)        │  Panel    │
 * │      │                      │           │
 * ├──────┴──────────────────────┴───────────┤
 * │         PromptChat (bottom, optional)   │
 * └─────────────────────────────────────────┘
 */
export const EditorLayout = observer(function EditorLayout(): React.JSX.Element {
  const uiStore = useUIStore()

  const showLayers = uiStore.isPanelVisible('layers')
  const showInspector = uiStore.isPanelVisible('inspector')
  const showPrompt = uiStore.isPanelVisible('prompt')

  // Build grid template columns based on visible panels
  const columns = [showLayers ? '240px' : '0px', '1fr', showInspector ? '280px' : '0px'].join(' ')

  // Build grid template rows
  const rows = [
    'auto', // toolbar
    '1fr', // main content
    showPrompt ? 'auto' : '0px' // prompt chat
  ].join(' ')

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gridTemplateRows: rows,
        gridTemplateAreas: `
          "toolbar toolbar toolbar"
          "layers viewport inspector"
          "prompt prompt prompt"
        `
      }}
    >
      {/* Toolbar — spans full width */}
      <div style={{ gridArea: 'toolbar' }}>
        <Toolbar />
      </div>

      {/* Left sidebar — Layer Panel */}
      {showLayers && (
        <div style={{ gridArea: 'layers' }} className="overflow-hidden">
          <LayerPanel />
        </div>
      )}

      {/* Center — Viewport */}
      <div style={{ gridArea: 'viewport' }} className="overflow-hidden min-w-0 min-h-0">
        <Viewport />
      </div>

      {/* Right sidebar — Inspector */}
      {showInspector && (
        <div style={{ gridArea: 'inspector' }} className="overflow-hidden">
          <Inspector />
        </div>
      )}

      {/* Bottom — Prompt Chat */}
      {showPrompt && (
        <div style={{ gridArea: 'prompt' }} className="max-h-64 overflow-hidden">
          <PromptChat />
        </div>
      )}
    </div>
  )
})
