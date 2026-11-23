import { useState } from 'react'
import { Database, FlaskConical } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { useDataMode } from '@/providers/DataModeProvider'
import { useToast } from '@/components/ui/toast'
import { DATA_MODES } from '@/lib/dataMode'
import { cn, timeAgo } from '@/lib/utils'
import { settingsService } from '@/services/settingsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Badge } from '@/components/ui/badge'

const ICONS = { production: Database, mock: FlaskConical }

/**
 * Admin-only: switch the whole app between real reports only (production)
 * and real + seeded demo data (mock). Applies to every user, live.
 */
export function DataModeCard() {
  const toast = useToast()
  const { user } = useAuth()
  const { mode, updatedAt, updatedBy, error, setMode } = useDataMode()
  const [pending, setPending] = useState(null)
  const counts = useAsync(() => settingsService.ticketCounts(), [])

  const confirm = async () => {
    try {
      await setMode(pending, user.id)
      toast.success(`Switched to ${DATA_MODES[pending].label}`, { description: 'Every user now sees this data.' })
    } catch (err) {
      toast.error('Data mode not changed', { description: err.message })
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        action={
          <Badge variant={mode === 'production' ? 'success' : 'warning'} dot>
            {DATA_MODES[mode].label}
          </Badge>
        }
      >
        <CardTitle>Data mode</CardTitle>
        <CardDescription>Prototype setting: choose whether the app shows seeded demo data. Applies to everyone.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <p className="rounded-md border border-warning/30 bg-warning/8 px-3 py-2 text-[13px]">
            Couldn&apos;t read the setting ({error}). Re-run <code className="font-mono">database/schema.sql</code> to enable data modes.
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Data mode">
          {Object.entries(DATA_MODES).map(([key, { label, hint }]) => {
            const Icon = ICONS[key]
            const active = mode === key
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={Boolean(error)}
                onClick={() => !active && setPending(key)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors disabled:opacity-50',
                  active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-accent/40',
                )}
              >
                <Icon className={cn('mt-0.5 size-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                <span className="grid gap-1">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-[12.5px] text-muted-foreground">{hint}</span>
                  {counts.data && (
                    <span className="font-mono text-[11.5px] text-muted-foreground">
                      {key === 'production'
                        ? `${counts.data.real} real tickets`
                        : `${counts.data.real + counts.data.demo} tickets (${counts.data.demo} demo)`}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        {updatedAt && (
          <p className="text-[12px] text-muted-foreground">
            Last changed {timeAgo(updatedAt)}
            {updatedBy && ` by ${updatedBy}`}.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending ? `Switch to ${DATA_MODES[pending].label}?` : ''}
        description={pending ? `${DATA_MODES[pending].hint} This changes what every user sees, right away.` : ''}
        confirmLabel="Switch"
        variant="default"
        onConfirm={confirm}
      />
    </Card>
  )
}
