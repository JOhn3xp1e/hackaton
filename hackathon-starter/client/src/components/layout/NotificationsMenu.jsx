import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, CheckCheck, MessageSquare, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { query, supabase } from '@/lib/supabase'
import { withoutDemo } from '@/lib/dataMode'
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
 * Staff notifications: newest reports and newest student comments.
 * "Read" state = everything older than the last time the user marked all read.
 */
async function loadNotifications() {
  const [tickets, comments] = await Promise.all([
    query(
      withoutDemo(
        supabase
          .from('tickets')
          .select('id, ticket_number, title, severity, created_at, location:locations!tickets_location_id_fkey ( name )')
          .order('created_at', { ascending: false })
          .limit(8),
      ),
      'Could not load notifications',
    ),
    query(
      withoutDemo(
        supabase
          .from('ticket_comments')
          .select('id, body, display_name, is_anonymous, created_at, ticket:tickets!inner ( ticket_number )')
          .is('author_id', null)
          .order('created_at', { ascending: false })
          .limit(8),
      ),
      'Could not load notifications',
    ),
  ])

  return [
    ...tickets.map((t) => ({
      id: `t-${t.id}`,
      kind: 'report',
      title: `New ${t.severity} report · ${t.ticket_number}`,
      body: `${t.title} — ${t.location?.name ?? ''}`,
      at: t.created_at,
      to: `/tickets/${t.ticket_number}`,
    })),
    ...comments.map((c) => ({
      id: `c-${c.id}`,
      kind: 'comment',
      title: `${c.is_anonymous || !c.display_name ? 'A student' : c.display_name} commented on ${c.ticket.ticket_number}`,
      body: c.body,
      at: c.created_at,
      to: `/tickets/${c.ticket.ticket_number}`,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 12)
}

export function NotificationsMenu() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [lastSeen, setLastSeen] = useLocalStorage(`cf-notifications-seen-${user?.id}`, 0)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setItems(await loadNotifications())
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const ch = supabase
      .channel(`notifications-${user?.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments' }, () => refresh())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [refresh, user?.id])

  const isUnread = (n) => new Date(n.at).getTime() > lastSeen
  const unread = items.filter(isUnread).length

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
            <p className="text-sm font-semibold">Activity</p>
            <p className="text-[12px] text-muted-foreground">{unread ? `${unread} unread` : 'All caught up'}</p>
          </div>
          {unread > 0 && (
            <button onClick={() => setLastSeen(Date.now())} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
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
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No reports or comments yet</p>
          )}
          {items.map((n) => {
            const Icon = n.kind === 'comment' ? MessageSquare : TriangleAlert
            return (
              <DropdownMenuItem key={n.id} onSelect={() => navigate(n.to)} className="items-start gap-3 py-2.5">
                <Icon className={cn('mt-0.5 size-4 shrink-0', isUnread(n) ? 'text-primary' : 'text-muted-foreground')} />
                <span className="grid min-w-0 gap-0.5">
                  <span className={cn('text-[13px] leading-snug', isUnread(n) && 'font-medium')}>{n.title}</span>
                  <span className="line-clamp-2 text-[12px] text-muted-foreground">{n.body}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{timeAgo(n.at)}</span>
                </span>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
