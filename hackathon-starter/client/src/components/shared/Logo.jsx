import { Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'

export function Logo({ collapsed = false, className }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground" aria-hidden>
        <Wrench className="size-4" strokeWidth={2.25} />
      </span>
      {!collapsed && (
        <span className="truncate font-display text-[15px] font-semibold tracking-tight">{config.appName}</span>
      )}
    </span>
  )
}
