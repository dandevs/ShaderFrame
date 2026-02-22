import { forwardRef, type TextareaHTMLAttributes, useId } from 'react'

type ResizeOption = 'none' | 'vertical' | 'horizontal' | 'both'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  resize?: ResizeOption
}

const resizeClasses: Record<ResizeOption, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize'
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, resize = 'vertical', className = '', id: externalId, ...rest },
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
      <textarea
        ref={ref}
        id={id}
        className={`
          min-h-16 px-2.5 py-1.5 text-sm
          rounded-md border
          bg-surface-50 border-surface-300 text-surface-900
          placeholder:text-surface-400
          dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
          dark:placeholder:text-surface-500
          focus:outline-2 focus:outline-offset-0 focus:outline-primary-500 focus:border-primary-500
          disabled:opacity-50
          transition-colors
          ${resizeClasses[resize]}
          ${error ? 'border-danger-500 dark:border-danger-500' : ''}
          ${className}
        `.trim()}
        {...rest}
      />
      {error && <span className="text-xs text-danger-500">{error}</span>}
    </div>
  )
})
