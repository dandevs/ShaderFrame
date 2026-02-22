import { useCallback, type ChangeEvent } from 'react'
import { observer } from 'mobx-react-lite'
import type { ShaderComponent } from '@renderer/types/shader'
import { useUIStore } from '@renderer/providers/StoreProvider'
import { IconButton, Checkbox, Tooltip } from '@renderer/ui-library'

interface ShaderComponentHeaderProps {
  component: ShaderComponent
  onToggleEnabled: (enabled: boolean) => void
  onRemove: () => void
}

export const ShaderComponentHeader = observer(function ShaderComponentHeader({
  component,
  onToggleEnabled,
  onRemove
}: ShaderComponentHeaderProps): React.JSX.Element {
  const uiStore = useUIStore()

  const handleEdit = useCallback(() => {
    uiStore.openPromptForEdit(component.id)
  }, [uiStore, component.id])

  const handleToggle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onToggleEnabled(e.target.checked)
    },
    [onToggleEnabled]
  )

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-100 dark:bg-surface-800 rounded-t-md border-b border-surface-200 dark:border-surface-700">
      <Checkbox checked={component.enabled} onChange={handleToggle} />
      <span
        className={`flex-1 text-xs font-semibold truncate ${
          component.enabled
            ? 'text-surface-800 dark:text-surface-200'
            : 'text-surface-400 dark:text-surface-500 line-through'
        }`}
      >
        {component.name}
      </span>
      <Tooltip content="Edit shader prompt" position="left">
        <IconButton label="Edit shader" size="sm" onClick={handleEdit}>
          <span className="text-[10px]">✏️</span>
        </IconButton>
      </Tooltip>
      <Tooltip content="Remove shader" position="left">
        <IconButton label="Remove shader" size="sm" onClick={onRemove}>
          <span className="text-[10px]">🗑</span>
        </IconButton>
      </Tooltip>
    </div>
  )
})
