import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

type ScrollDirection = 'vertical' | 'horizontal' | 'both'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  direction?: ScrollDirection
}

const overflowClasses: Record<ScrollDirection, string> = {
  vertical: 'overflow-y-auto overflow-x-hidden',
  horizontal: 'overflow-x-auto overflow-y-hidden',
  both: 'overflow-auto'
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { children, direction = 'vertical', className = '', ...rest },
  ref
) {
  return (
    <div ref={ref} className={`${overflowClasses[direction]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
})
