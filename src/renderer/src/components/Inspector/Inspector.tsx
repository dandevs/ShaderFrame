import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { isGroupLayer } from '@renderer/types/layers'
import type { UniformType, UniformValueMap } from '@renderer/types/shader'
import { ScrollArea, Button, Panel } from '@renderer/ui-library'
import { ShaderComponentHeader } from './ShaderComponentHeader'
import { UniformField } from './fields'

export const Inspector = observer(function Inspector(): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()

  const selectedLayer = uiStore.selectedLayerId
    ? projectStore.findLayer(uiStore.selectedLayerId)
    : undefined

  const isGroup = selectedLayer && isGroupLayer(selectedLayer)

  const shaderComponentIds = isGroup ? selectedLayer.shaderComponents : []
  const shaderComponents = shaderComponentIds
    .map((id) => projectStore.getShaderComponent(id))
    .filter(Boolean)

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
              {/* Layer info */}
              <Panel title="Layer">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Name</span>
                    <span className="text-surface-800 dark:text-surface-200 font-medium">
                      {selectedLayer.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Type</span>
                    <span className="text-surface-800 dark:text-surface-200 font-medium capitalize">
                      {selectedLayer.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Position</span>
                    <span className="text-surface-800 dark:text-surface-200 font-mono text-[11px]">
                      {selectedLayer.position.x}, {selectedLayer.position.y}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Size</span>
                    <span className="text-surface-800 dark:text-surface-200 font-mono text-[11px]">
                      {selectedLayer.size.width} × {selectedLayer.size.height}
                    </span>
                  </div>
                </div>
              </Panel>

              {/* Shader components — only for group layers */}
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
