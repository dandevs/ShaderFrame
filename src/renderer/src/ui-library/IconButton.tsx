import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type IconButtonVariant = 'ghost' | 'secondary' | 'primary'
type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Accessibility label — used as aria-label */
  label: string
  children: ReactNode
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    'bg-transparent text-surface-600 hover:bg-surface-200 hover:text-surface-800 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200',
  secondary:
    'bg-surface-200 text-surface-700 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600',
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400'
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-7 h-7 text-sm',
  lg: 'w-8 h-8 text-base'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', label, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={`
        inline-flex items-center justify-center
        rounded-md
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
