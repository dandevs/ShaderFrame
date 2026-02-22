import { useState, useCallback, type ReactNode, type KeyboardEvent } from 'react'

interface PanelProps {
  title?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({
  title,
  collapsible = false,
  defaultCollapsed = false,
  actions,
  children,
  className = ''
}: PanelProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const toggleCollapse = useCallback(() => {
    if (collapsible) setCollapsed((prev) => !prev)
  }, [collapsible])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleCollapse()
      }
    },
    [toggleCollapse]
  )

  return (
    <div
      className={`
        border rounded-lg
        bg-surface-50 border-surface-200
        dark:bg-surface-850 dark:border-surface-700
        ${className}
      `.trim()}
    >
      {title && (
        <div
          className={`
            flex items-center justify-between px-2.5 py-1.5
            border-b border-surface-200 dark:border-surface-700
            ${collapsible ? 'cursor-pointer select-none hover:bg-surface-100 dark:hover:bg-surface-800' : ''}
          `.trim()}
          onClick={toggleCollapse}
          role={collapsible ? 'button' : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={collapsible ? handleKeyDown : undefined}
        >
          <div className="flex items-center gap-1.5">
            {collapsible && (
              <span
                className={`
                  text-xs text-surface-500 transition-transform duration-150
                  ${collapsed ? '' : 'rotate-90'}
                `.trim()}
              >
                &#9654;
              </span>
            )}
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
              {title}
            </span>
          </div>
          {actions && <div className="flex items-center gap-0.5">{actions}</div>}
        </div>
      )}
      {!collapsed && <div className="p-2.5">{children}</div>}
    </div>
  )
}
