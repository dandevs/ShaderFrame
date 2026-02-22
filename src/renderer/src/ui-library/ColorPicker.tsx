import { useId, useCallback, type ChangeEvent } from 'react'

interface ColorPickerProps {
  label?: string
  /** Hex color string, e.g. "#ff00aa" */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ColorPicker({
  label,
  value,
  onChange,
  disabled = false,
  className = ''
}: ColorPickerProps): React.JSX.Element {
  const id = useId()

  const handleColorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        onChange(hex)
      }
    },
    [onChange]
  )

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-surface-600 dark:text-surface-400">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          id={id}
          value={value}
          onChange={handleColorChange}
          disabled={disabled}
          className={`
            w-7 h-7 rounded-md border cursor-pointer
            border-surface-300 dark:border-surface-600
            disabled:opacity-50 disabled:cursor-default
          `.trim()}
          style={{ padding: 2 }}
        />
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          disabled={disabled}
          maxLength={7}
          className={`
            w-20 h-6 px-1.5 text-xs font-mono rounded-md border
            bg-surface-50 border-surface-300 text-surface-900
            dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
            focus:outline-2 focus:outline-primary-500
            disabled:opacity-50
          `.trim()}
        />
      </div>
    </div>
  )
}
