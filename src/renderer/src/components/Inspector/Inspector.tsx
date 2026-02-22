import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { isGroupLayer, isTextLayer } from '@renderer/types/layers'
import type { Layer, TextLayer } from '@renderer/types/layers'
import type { UniformType, UniformValueMap } from '@renderer/types/shader'
import {
  ScrollArea,
  Button,
  Panel,
  Input,
  Slider,
  Select,
  TextArea,
  ColorPicker
} from '@renderer/ui-library'
import { ShaderComponentHeader } from './ShaderComponentHeader'
import { UniformField } from './fields'

// ─────────────────────────────────────────────────────────────────────────────
// Shared number-pair row (x/y or w/h)
// ─────────────────────────────────────────────────────────────────────────────

interface Vec2RowProps {
  labelA: string
  labelB: string
  valueA: number
  valueB: number
  onChangeA: (v: number) => void
  onChangeB: (v: number) => void
}

function Vec2Row({
  labelA,
  labelB,
  valueA,
  valueB,
  onChangeA,
  onChangeB
}: Vec2RowProps): React.JSX.Element {
  return (
    <div className="flex gap-1.5">
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-[10px] text-surface-500 dark:text-surface-400">{labelA}</span>
        <input
          type="number"
          value={Math.round(valueA * 10) / 10}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChangeA(n)
          }}
          className="w-full h-6 px-1.5 text-xs text-right rounded-md border
            bg-surface-50 border-surface-300 text-surface-900
            dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
            focus:outline-2 focus:outline-primary-500"
        />
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-[10px] text-surface-500 dark:text-surface-400">{labelB}</span>
        <input
          type="number"
          value={Math.round(valueB * 10) / 10}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChangeB(n)
          }}
          className="w-full h-6 px-1.5 text-xs text-right rounded-md border
            bg-surface-50 border-surface-300 text-surface-900
            dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
            focus:outline-2 focus:outline-primary-500"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BaseLayerFields — shared by all layer types
// ─────────────────────────────────────────────────────────────────────────────

interface BaseLayerFieldsProps {
  layer: Layer
  onUpdate: (updates: Partial<Layer>) => void
}

function BaseLayerFields({ layer, onUpdate }: BaseLayerFieldsProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Input
        label="Name"
        size="sm"
        value={layer.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />

      <Vec2Row
        labelA="X"
        labelB="Y"
        valueA={layer.position.x}
        valueB={layer.position.y}
        onChangeA={(x) => onUpdate({ position: { ...layer.position, x } })}
        onChangeB={(y) => onUpdate({ position: { ...layer.position, y } })}
      />

      <Vec2Row
        labelA="W"
        labelB="H"
        valueA={layer.size.width}
        valueB={layer.size.height}
        onChangeA={(width) => onUpdate({ size: { ...layer.size, width } })}
        onChangeB={(height) => onUpdate({ size: { ...layer.size, height } })}
      />

      <Slider
        label="Rotation"
        value={layer.rotation}
        min={0}
        max={360}
        step={1}
        onChange={(rotation) => onUpdate({ rotation })}
      />

      <Slider
        label="Opacity"
        value={layer.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(opacity) => onUpdate({ opacity })}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TextLayerFields — text-specific properties
// ─────────────────────────────────────────────────────────────────────────────

const TEXT_ALIGN_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
]

const FONT_WEIGHT_OPTIONS = [
  { label: 'Thin (100)', value: '100' },
  { label: 'Light (300)', value: '300' },
  { label: 'Regular (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semi-Bold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
  { label: 'Black (900)', value: '900' }
]

interface TextLayerFieldsProps {
  layer: TextLayer
  onUpdate: (updates: Partial<TextLayer>) => void
}

function TextLayerFields({ layer, onUpdate }: TextLayerFieldsProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <TextArea
        label="Content"
        value={layer.content}
        resize="vertical"
        rows={3}
        onChange={(e) => onUpdate({ content: e.target.value })}
      />

      <ColorPicker label="Color" value={layer.color} onChange={(color) => onUpdate({ color })} />

      <Slider
        label="Font Size"
        value={layer.fontSize}
        min={6}
        max={300}
        step={1}
        onChange={(fontSize) => onUpdate({ fontSize })}
      />

      <Select
        label="Font Weight"
        size="sm"
        value={String(layer.fontWeight)}
        options={FONT_WEIGHT_OPTIONS}
        onChange={(e) => onUpdate({ fontWeight: parseInt(e.target.value, 10) })}
      />

      <Select
        label="Text Align"
        size="sm"
        value={layer.textAlign}
        options={TEXT_ALIGN_OPTIONS}
        onChange={(e) => onUpdate({ textAlign: e.target.value as TextLayer['textAlign'] })}
      />

      <Slider
        label="Line Height"
        value={layer.lineHeight}
        min={0.5}
        max={3}
        step={0.05}
        onChange={(lineHeight) => onUpdate({ lineHeight })}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inspector
// ─────────────────────────────────────────────────────────────────────────────

export const Inspector = observer(function Inspector(): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()

  const selectedLayer = uiStore.selectedLayerId
    ? projectStore.findLayer(uiStore.selectedLayerId)
    : undefined

  const isGroup = selectedLayer && isGroupLayer(selectedLayer)
  const isText = selectedLayer && isTextLayer(selectedLayer)

  const shaderComponentIds = isGroup ? selectedLayer.shaderComponents : []
  const shaderComponents = shaderComponentIds
    .map((id) => projectStore.getShaderComponent(id))
    .filter(Boolean)

  const handleLayerUpdate = useCallback(
    (updates: Partial<Layer>) => {
      if (!selectedLayer) return
      projectStore.updateLayer(selectedLayer.id, updates)
    },
    [projectStore, selectedLayer]
  )

  const handleUniformChange = useCallback(
    (componentId: string, uniformName: string, value: UniformValueMap[UniformType]) => {
      projectStore.updateShaderUniform(componentId, uniformName, value)
    },
    [projectStore]
  )

  const handleToggleEnabled = useCallback(
    (componentId: string, enabled: boolean) => {
      projectStore.updateShaderComponent(componentId, { enabled })
    },
    [projectStore]
  )

  const handleRemoveComponent = useCallback(
    (componentId: string) => {
      if (!uiStore.selectedLayerId) return
      projectStore.removeShaderComponent(componentId, uiStore.selectedLayerId)
    },
    [projectStore, uiStore]
  )

  const handleAddShader = useCallback(() => {
    uiStore.openPromptForNewShader()
  }, [uiStore])

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-850 border-l border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-200 dark:border-surface-700">
        <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
          Inspector
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {!selectedLayer && (
            <div className="px-2 py-8 text-center text-xs text-surface-400 dark:text-surface-500">
              Select a layer to inspect its properties.
            </div>
          )}

          {selectedLayer && (
            <>
              {/* ── Base layer properties ── */}
              <Panel title="Layer">
                <BaseLayerFields layer={selectedLayer} onUpdate={handleLayerUpdate} />
              </Panel>

              {/* ── Text-specific properties ── */}
              {isText && (
                <Panel title="Text">
                  <TextLayerFields
                    layer={selectedLayer}
                    onUpdate={handleLayerUpdate as (u: Partial<TextLayer>) => void}
                  />
                </Panel>
              )}

              {/* ── Shader components — group layers only ── */}
              {isGroup && (
                <Panel
                  title="Shaders"
                  actions={
                    <Button size="sm" variant="ghost" onClick={handleAddShader}>
                      + Add
                    </Button>
                  }
                >
                  {shaderComponents.length === 0 ? (
                    <div className="text-xs text-surface-400 dark:text-surface-500 text-center py-4">
                      No shaders attached.
                      <br />
                      <button
                        onClick={handleAddShader}
                        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 underline mt-1 cursor-pointer"
                      >
                        Generate one with AI
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shaderComponents.map((component) => {
                        if (!component) return null
                        return (
                          <div
                            key={component.id}
                            className="rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden"
                          >
                            <ShaderComponentHeader
                              component={component}
                              onToggleEnabled={(enabled) =>
                                handleToggleEnabled(component.id, enabled)
                              }
                              onRemove={() => handleRemoveComponent(component.id)}
                            />
                            {component.enabled && component.uniforms.length > 0 && (
                              <div className="p-2 space-y-2.5">
                                {component.uniforms.map((uniform) => (
                                  <UniformField
                                    key={uniform.uniformName}
                                    uniform={uniform}
                                    onChange={(uniformName, value) =>
                                      handleUniformChange(component.id, uniformName, value)
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Panel>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
})
