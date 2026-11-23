import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, CheckCheck } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { query, supabase } from '@/lib/supabase'
import { STATUSES } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Staff: newest reported tickets.
 * Reporters: status changes on their own tickets made by someone else.
 * "Read" state = everything older than the last time the user marked all read.
 */
async function loadNotifications(userId, isStaff) {
  if (isStaff) {
    const rows = await query(
      supabase
        .from('tickets')
        .select('id, ticket_number, title, severity, created_at, location:locations!tickets_location_id_fkey ( name )')
        .order('created_at', { ascending: false })
        .limit(10),
      'Could not load notifications',
    )
    return rows.map((t) => ({
      id: t.id,
      title: `New ${t.severity} report · ${t.ticket_number}`,
      body: `${t.title} — ${t.location?.name ?? ''}`,
      at: t.created_at,
      to: `/tickets/${t.ticket_number}`,
    }))
  }

  const rows = await query(
    supabase
      .from('ticket_updates')
      .select('id, to_status, note, created_at, author_id, ticket:tickets!inner ( ticket_number, title, reporter_id )')
      .eq('ticket.reporter_id', userId)
      .neq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    'Could not load notifications',
  )
  return rows.map((u) => ({
    id: u.id,
    title: `${u.ticket.ticket_number} is now ${STATUSES[u.to_status]?.label ?? u.to_status}`,
    body: u.note || u.ticket.title,
    at: u.created_at,
    to: `/tickets/${u.ticket.ticket_number}`,
  }))
}

export function NotificationsMenu() {
  const navigate = useNavigate()
  const { user, isStaff } = useAuth()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [lastSeen, setLastSeen] = useLocalStorage(`cf-notifications-seen-${user?.id}`, 0)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      setError(null)
      setItems(await loadNotifications(user.id, isStaff))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [user, isStaff])

  useEffect(() => {
    refresh()
    if (!user) return undefined
    const table = isStaff ? 'tickets' : 'ticket_updates'
    const ch = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, () => refresh())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [refresh, user, isStaff])

  const isUnread = (n) => new Date(n.at).getTime() > lastSeen
  const unread = items.filter(isUnread).length
  const markAllRead = () => setLastSeen(Date.now())

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} className="relative">
          <Bell />
          {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-primary" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{isStaff ? 'New reports' : 'Updates on your reports'}</p>
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
          {isLoading && (
            <div className="grid place-items-center py-6 text-muted-foreground">
              <Spinner />
            </div>
          )}
          {!isLoading && error && <p className="px-3 py-6 text-center text-sm text-destructive">{error}</p>}
          {!isLoading && !error && items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {isStaff ? 'No reports yet' : 'No updates yet. You will see status changes here.'}
            </p>
          )}
          {items.map((n) => (
            <DropdownMenuItem key={n.id} onSelect={() => navigate(n.to)} className="items-start gap-3 py-2.5">
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', isUnread(n) ? 'bg-primary' : 'bg-transparent')} />
              <span className="grid min-w-0 gap-0.5">
                <span className={cn('text-[13px] leading-snug', isUnread(n) && 'font-medium')}>{n.title}</span>
                <span className="line-clamp-2 text-[12px] text-muted-foreground">{n.body}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{timeAgo(n.at)}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
