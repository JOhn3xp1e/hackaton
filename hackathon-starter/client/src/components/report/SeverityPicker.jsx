import { Sparkles } from 'lucide-react'
import { SEVERITIES, SEVERITY_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ACTIVE = {
  low: 'border-border bg-secondary text-foreground ring-foreground/10',
  medium: 'border-warning/40 bg-warning/10 text-warning ring-warning/20',
  high: 'border-destructive/40 bg-destructive/10 text-destructive ring-destructive/20',
  critical: 'border-transparent bg-destructive text-destructive-foreground ring-destructive/30',
}

/** Segmented control for severity with a one-line hint under each option. */
export function SeverityPicker({ value, onChange, aiValue }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Severity">
      {SEVERITY_KEYS.map((key) => {
        const { label, hint } = SEVERITIES[key]
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={cn(
              'relative grid gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
              active ? cn('ring-2', ACTIVE[key]) : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
            )}
          >
            {aiValue === key && <Sparkles className="absolute right-2 top-2 size-3.5" aria-label="AI suggestion" />}
            <span className="text-sm font-semibold">{label}</span>
            <span className={cn('text-[11.5px] leading-snug', active ? 'opacity-85' : 'text-muted-foreground')}>{hint}</span>
          </button>
        )
      })}
    </div>
  )
}
