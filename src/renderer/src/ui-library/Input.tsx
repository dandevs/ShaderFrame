import { forwardRef, type InputHTMLAttributes, useId } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: 'h-6 px-2 text-xs',
  md: 'h-7 px-2.5 text-sm'
} as const

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, size = 'md', className = '', id: externalId, ...rest },
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
      <input
        ref={ref}
        id={id}
        className={`
          ${sizeClasses[size]}
          rounded-md border
          bg-surface-50 border-surface-300 text-surface-900
          placeholder:text-surface-400
          dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
          dark:placeholder:text-surface-500
          focus:outline-2 focus:outline-offset-0 focus:outline-primary-500 focus:border-primary-500
          disabled:opacity-50
          transition-colors
          ${error ? 'border-danger-500 dark:border-danger-500' : ''}
          ${className}
        `.trim()}
        {...rest}
      />
      {error && <span className="text-xs text-danger-500">{error}</span>}
    </div>
  )
})
