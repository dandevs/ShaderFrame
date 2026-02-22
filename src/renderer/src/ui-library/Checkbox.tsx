import { forwardRef, type InputHTMLAttributes, useId } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate, className = '', id: externalId, ...rest },
  ref
) {
  const autoId = useId()
  const id = externalId ?? autoId

  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        ref={(node) => {
          if (node) node.indeterminate = indeterminate ?? false
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type="checkbox"
        id={id}
        className={`
          w-3.5 h-3.5 rounded-sm border cursor-pointer
          border-surface-400 text-primary-500
          dark:border-surface-500
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
          dark:focus:ring-offset-surface-800
          disabled:opacity-50 disabled:cursor-default
          accent-primary-500
          ${className}
        `.trim()}
        {...rest}
      />
      {label && (
        <label
          htmlFor={id}
          className="text-xs text-surface-700 dark:text-surface-300 cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  )
})
