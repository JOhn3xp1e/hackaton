import { cn } from '@/lib/utils'
import { config } from '@/lib/config'

/** Brand mark: a scan frame with a "+" — scan the room QR, add a report. */
export function LogoMark({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-7 shrink-0 text-primary', className)}
      aria-hidden
    >
      <path d="M3 8V5a2 2 0 0 1 2-2h3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
}

export function Logo({ collapsed = false, className }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="size-6" />
      {!collapsed && (
        <span className="truncate font-display text-[17px] font-bold tracking-tight">{config.appName}</span>
      )}
    </span>
  )
}
