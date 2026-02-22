import type { ReactNode } from 'react'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: string
  position?: TooltipPosition
  children: ReactNode
}

const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5'
}

export function Tooltip({ content, position = 'top', children }: TooltipProps): React.JSX.Element {
  return (
    <div className="relative inline-flex group">
      {children}
      <div
        role="tooltip"
        className={`
          absolute z-50 pointer-events-none
          px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap
          bg-surface-900 text-surface-50
          dark:bg-surface-100 dark:text-surface-900
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150 delay-300
          ${positionClasses[position]}
        `.trim()}
      >
        {content}
      </div>
    </div>
  )
}
