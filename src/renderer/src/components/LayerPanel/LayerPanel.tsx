import { useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { isGroupLayer } from '@renderer/types/layers'
import { IconButton, ScrollArea, Tooltip } from '@renderer/ui-library'
import { LayerTreeItem } from './LayerTreeItem'

export const LayerPanel = observer(function LayerPanel(): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()
  const [dragState, setDragState] = useState<{
    dragId: string | null
    targetId: string | null
    position: 'before' | 'inside' | 'after' | null
  }>({ dragId: null, targetId: null, position: null })

  const handleDragStart = useCallback((layerId: string) => {
    setDragState({ dragId: layerId, targetId: null, position: null })
  }, [])

  const handleDragOver = useCallback((layerId: string, position: 'before' | 'inside' | 'after') => {
    setDragState((prev) => ({ ...prev, targetId: layerId, position }))
  }, [])

  const handleDrop = useCallback(() => {
    const { dragId, targetId, position } = dragState
    if (!dragId || !targetId || !position || dragId === targetId) {
      setDragState({ dragId: null, targetId: null, position: null })
      return
    }

    const targetLayer = projectStore.findLayer(targetId)
    if (!targetLayer) {
      setDragState({ dragId: null, targetId: null, position: null })
      return
    }

    if (position === 'inside' && isGroupLayer(targetLayer)) {
      // Drop inside a group — append at the end of the group's children
      projectStore.moveLayer(dragId, targetId, targetLayer.children.length)
    } else {
      // Drop before/after a sibling
      const parent = projectStore.findParent(targetId)
      const siblings = parent && isGroupLayer(parent) ? parent.children : projectStore.layers
      const targetIdx = siblings.findIndex((l) => l.id === targetId)
      const insertIdx = position === 'before' ? targetIdx : targetIdx + 1
      const parentId = parent ? parent.id : null

      projectStore.moveLayer(dragId, parentId, insertIdx)
    }

    setDragState({ dragId: null, targetId: null, position: null })
  }, [dragState, projectStore])

  const handleAddGroup = useCallback(() => {
    projectStore.createGroupLayer('New Group')
  }, [projectStore])

  const handleDelete = useCallback(() => {
    if (uiStore.selectedLayerId) {
      projectStore.removeLayer(uiStore.selectedLayerId)
      uiStore.selectLayer(null)
    }
  }, [projectStore, uiStore])

  const handleImportImage = useCallback(async () => {
    const result = await window.api.openImage()
    if (!result) return

    // Create an image to get natural dimensions
    const img = new Image()
    img.onload = (): void => {
      // If a group is selected, insert into that group
      const selectedId = uiStore.selectedLayerId
      const selectedLayer = selectedId ? projectStore.findLayer(selectedId) : undefined
      const parentId = selectedLayer && isGroupLayer(selectedLayer) ? selectedLayer.id : undefined

      projectStore.createImageLayer(
        result.dataUri,
        result.name,
        img.naturalWidth,
        img.naturalHeight,
        parentId
      )
    }
    img.src = result.dataUri
  }, [projectStore, uiStore])

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-850 border-r border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-200 dark:border-surface-700">
        <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
          Layers
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip content="Import Image" position="bottom">
            <IconButton label="Import image" size="sm" onClick={handleImportImage}>
              <span className="text-xs">📷</span>
            </IconButton>
          </Tooltip>
          <Tooltip content="Add Group" position="bottom">
            <IconButton label="Add group" size="sm" onClick={handleAddGroup}>
              <span className="text-xs">📁</span>
            </IconButton>
          </Tooltip>
          <Tooltip content="Delete Selected" position="bottom">
            <IconButton
              label="Delete selected"
              size="sm"
              onClick={handleDelete}
              disabled={!uiStore.selectedLayerId}
            >
              <span className="text-xs">🗑</span>
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Layer tree */}
      <ScrollArea className="flex-1">
        <div className="py-0.5">
          {projectStore.layers.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-surface-400 dark:text-surface-500">
              No layers yet. Import an image or add a group to get started.
            </div>
          ) : (
            projectStore.layers.map((layer) => (
              <LayerTreeItem
                key={layer.id}
                layer={layer}
                depth={0}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Drop zone for external image files */}
      <div
        className="px-2 py-2 border-t border-surface-200 dark:border-surface-700 text-center"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
          for (const file of files) {
            const reader = new FileReader()
            reader.onload = (): void => {
              const dataUri = reader.result as string
              const img = new Image()
              img.onload = (): void => {
                projectStore.createImageLayer(
                  dataUri,
                  file.name.replace(/\.[^.]+$/, ''),
                  img.naturalWidth,
                  img.naturalHeight
                )
              }
              img.src = dataUri
            }
            reader.readAsDataURL(file)
          }
        }}
      >
        <span className="text-[10px] text-surface-400 dark:text-surface-500">Drop images here</span>
      </div>
    </div>
  )
})
