import { cn } from '@/lib/utils'
import { config } from '@/lib/config'

/** Replace the mark + name with the team/product brand on hackathon day. */
export function Logo({ collapsed = false, className }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-7 shrink-0 grid-cols-2 gap-[3px] rounded-md bg-foreground p-[6px]" aria-hidden>
        <span className="rounded-[1.5px] bg-background" />
        <span className="rounded-[1.5px] bg-primary" />
        <span className="rounded-[1.5px] bg-primary" />
        <span className="rounded-[1.5px] bg-background" />
      </span>
      {!collapsed && (
        <span className="truncate font-display text-[15px] font-semibold tracking-tight">{config.appName}</span>
      )}
    </span>
  )
}
