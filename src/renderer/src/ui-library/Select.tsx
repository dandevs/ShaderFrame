import { forwardRef, type SelectHTMLAttributes, useId } from 'react'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: 'h-6 px-2 text-xs',
  md: 'h-7 px-2.5 text-sm'
} as const

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, error, size = 'md', className = '', id: externalId, ...rest },
  ref
) {
  const autoId = useId()
  const id = externalId ?? autoId

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-surface-600 dark:text-surface-400">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`
          ${sizeClasses[size]}
          rounded-md border appearance-none
          bg-surface-50 border-surface-300 text-surface-900
          dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
          focus:outline-2 focus:outline-offset-0 focus:outline-primary-500 focus:border-primary-500
          disabled:opacity-50
          transition-colors cursor-pointer
          ${error ? 'border-danger-500 dark:border-danger-500' : ''}
          ${className}
        `.trim()}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger-500">{error}</span>}
    </div>
  )
})
