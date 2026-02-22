import { useState, useCallback, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import type { Layer, GroupLayer } from '@renderer/types/layers'
import { isGroupLayer } from '@renderer/types/layers'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { IconButton } from '@renderer/ui-library'

interface LayerTreeItemProps {
  layer: Layer
  depth: number
  onDragStart: (layerId: string) => void
  onDragOver: (layerId: string, position: 'before' | 'inside' | 'after') => void
  onDrop: () => void
}

/** Get icon for layer type */
function layerIcon(layer: Layer): string {
  switch (layer.type) {
    case 'image':
      return '🖼'
    case 'text':
      return 'T'
    case 'group':
      return '📁'
  }
}

export const LayerTreeItem = observer(function LayerTreeItem({
  layer,
  depth,
  onDragStart,
  onDragOver,
  onDrop
}: LayerTreeItemProps): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(layer.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSelected = uiStore.selectedLayerId === layer.id
  const isGroup = isGroupLayer(layer)
  const isExpanded = isGroup && layer.expanded
  const isRoot = projectStore.rootLayerId === layer.id

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleSelect = useCallback(() => {
    uiStore.selectLayer(layer.id)
  }, [uiStore, layer.id])

  const handleDoubleClick = useCallback(() => {
    setRenameValue(layer.name)
    setIsRenaming(true)
  }, [layer.name])

  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim()) {
      projectStore.updateLayer(layer.id, { name: renameValue.trim() })
    }
    setIsRenaming(false)
  }, [projectStore, layer.id, renameValue])

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameSubmit()
      if (e.key === 'Escape') setIsRenaming(false)
    },
    [handleRenameSubmit]
  )

  const toggleVisibility = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      projectStore.updateLayer(layer.id, { visible: !layer.visible })
    },
    [projectStore, layer.id, layer.visible]
  )

  const handleAddChild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      projectStore.createEmptyLayer('New Layer', layer.id)
    },
    [projectStore, layer.id]
  )

  const toggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isGroup) {
        projectStore.updateLayer(layer.id, {
          expanded: !(layer as GroupLayer).expanded
        } as Partial<GroupLayer>)
      }
    },
    [projectStore, layer.id, isGroup, layer]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', layer.id)
      onDragStart(layer.id)
    },
    [layer.id, onDragStart]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let position: 'before' | 'inside' | 'after'
      if (isGroup && y > height * 0.25 && y < height * 0.75) {
        position = 'inside'
      } else if (y < height * 0.5) {
        position = 'before'
      } else {
        position = 'after'
      }
      onDragOver(layer.id, position)
    },
    [layer.id, isGroup, onDragOver]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDrop()
    },
    [onDrop]
  )

  return (
    <>
      <div
        className={[
          'group flex items-center gap-1 px-1 py-0.5 cursor-pointer select-none',
          'border-l-2 transition-colors duration-100',
          isSelected
            ? 'bg-primary-500/15 border-l-primary-500 dark:bg-primary-500/20'
            : 'border-l-transparent hover:bg-surface-200 dark:hover:bg-surface-700',
          !layer.visible ? 'opacity-50' : ''
        ].join(' ')}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Expand/collapse for groups */}
        {isGroup ? (
          <button
            onClick={toggleExpand}
            className="w-4 h-4 flex items-center justify-center text-[10px] text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <span className="text-xs w-4 text-center shrink-0">{layerIcon(layer)}</span>

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="flex-1 min-w-0 text-xs px-1 py-0 h-5 bg-surface-50 dark:bg-surface-800 border border-primary-500 rounded-sm outline-none"
          />
        ) : (
          <span className="flex-1 text-xs truncate text-surface-800 dark:text-surface-200">
            {layer.name}
          </span>
        )}

        {/* Add child layer button — groups only, visible on hover */}
        {isGroup && (
          <IconButton
            label="Add child layer"
            size="sm"
            onClick={handleAddChild}
            className="opacity-0 group-hover:opacity-100 hover:!opacity-100"
          >
            <span className="text-[10px]">+</span>
          </IconButton>
        )}

        {/* Visibility toggle */}
        {isRoot ? (
          <span className="w-6 h-6" />
        ) : (
          <IconButton
            label={layer.visible ? 'Hide layer' : 'Show layer'}
            size="sm"
            onClick={toggleVisibility}
            className="opacity-0 group-hover:opacity-100 hover:!opacity-100"
          >
            <span className="text-[10px]">{layer.visible ? '👁' : '👁‍🗨'}</span>
          </IconButton>
        )}
      </div>

      {/* Render children if expanded group */}
      {isGroup &&
        isExpanded &&
        (layer as GroupLayer).children.map((child) => (
          <LayerTreeItem
            key={child.id}
            layer={child}
            depth={depth + 1}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
        ))}
    </>
  )
})
