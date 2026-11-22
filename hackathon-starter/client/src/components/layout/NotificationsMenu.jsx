import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { dashboardService } from '@/services/dashboardService'
import { cn, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NotificationsMenu() {
  const { data, setData } = useAsync(() => dashboardService.getNotifications().then((r) => r.data), [], { initialData: [] })
  const [open, setOpen] = useState(false)
  const items = data ?? []
  const unread = items.filter((n) => !n.read).length

  const markAllRead = () => setData((list) => list.map((n) => ({ ...n, read: true })))

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} className="relative">
          <Bell />
          {unread > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[12px] text-muted-foreground">{unread ? `${unread} unread` : 'All caught up'}</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</p>}
          {items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onSelect={(e) => {
                e.preventDefault()
                setData((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
              }}
              className="items-start gap-3 py-2.5"
            >
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
              <span className="grid gap-0.5">
                <span className={cn('text-[13px] leading-snug', !n.read && 'font-medium')}>{n.title}</span>
                <span className="text-[12px] text-muted-foreground">{n.body}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{timeAgo(n.at)}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
