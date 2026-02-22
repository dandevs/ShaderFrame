import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400',
  secondary:
    'bg-surface-200 text-surface-800 hover:bg-surface-300 active:bg-surface-400 dark:bg-surface-700 dark:text-surface-200 dark:hover:bg-surface-600',
  ghost:
    'bg-transparent text-surface-700 hover:bg-surface-200 active:bg-surface-300 dark:text-surface-300 dark:hover:bg-surface-700 dark:active:bg-surface-600',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 dark:bg-danger-500 dark:hover:bg-danger-600'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-sm'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className = '', disabled, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-1.5
        rounded-md font-medium
        transition-colors duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
        disabled:opacity-50 disabled:pointer-events-none
        select-none cursor-pointer
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      {...rest}
    >
      {children}
    </button>
  )
})
