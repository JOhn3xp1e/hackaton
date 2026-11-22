import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Wrap the app once (done in main.jsx). */
export const TooltipProvider = ({ delayDuration = 250, ...props }) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
)

/**
 * Tooltip — simple one-liner API.
 *   <Tooltip content="Export CSV"><Button size="icon">…</Button></Tooltip>
 */
export function Tooltip({ content, side = 'top', align = 'center', children, className, ...props }) {
  if (!content) return children
  return (
    <TooltipPrimitive.Root {...props}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'z-50 max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md',
            'data-[state=delayed-open]:animate-pop-in data-[state=instant-open]:animate-pop-in data-[state=closed]:animate-pop-out',
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-foreground" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
