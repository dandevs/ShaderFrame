import { useId, useCallback, type ChangeEvent } from 'react'

interface SliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  showValue?: boolean
  className?: string
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  showValue = true,
  className = ''
}: SliderProps): React.JSX.Element {
  const id = useId()

  const handleSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value))
    },
    [onChange]
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value)
      if (!isNaN(parsed)) {
        onChange(Math.min(max, Math.max(min, parsed)))
      }
    },
    [onChange, min, max]
  )

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-surface-600 dark:text-surface-400">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            flex-1 h-1.5 rounded-full appearance-none cursor-pointer
            bg-surface-300 dark:bg-surface-600
            accent-primary-500
            disabled:opacity-50 disabled:cursor-default
          `.trim()}
        />
        {showValue && (
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={`
              w-14 h-6 px-1.5 text-xs text-right rounded-md border
              bg-surface-50 border-surface-300 text-surface-900
              dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
              focus:outline-2 focus:outline-primary-500
              disabled:opacity-50
            `.trim()}
          />
        )}
      </div>
    </div>
  )
}
