import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, formatNumber } from '@/lib/utils'
import { AnimatedCounter } from './AnimatedCounter'

/**
 * StatCard — KPI tile with animated number, trend delta and optional sparkline.
 *   <StatCard label="Revenue" value={48200} format={formatCurrency} delta={12.4} icon={DollarSign}
 *             spark={[3,5,4,8,6,9]} hint="vs last month" />
 * `invertTrend` makes a decrease "good" (e.g. error rate).
 */
export function StatCard({ label, value, format = formatNumber, delta, hint, icon: Icon, spark, invertTrend, className }) {
  const up = delta >= 0
  const good = invertTrend ? !up : up

  return (
    <Card interactive className={cn('relative overflow-hidden p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {Icon && (
          <span className="grid size-8 place-items-center rounded-md border border-border bg-background text-muted-foreground">
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <AnimatedCounter value={value} format={format} className="font-display text-[28px] font-semibold leading-none tracking-tight tabular" />
          {(delta !== undefined || hint) && (
            <p className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-muted-foreground">
              {delta !== undefined && (
                <span className={cn('inline-flex items-center gap-0.5 font-medium tabular', good ? 'text-success' : 'text-destructive')}>
                  {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
              {hint}
            </p>
          )}
        </div>
        {spark && <Sparkline data={spark} className={good ? 'text-success' : 'text-destructive'} />}
      </div>
    </Card>
  )
}

function Sparkline({ data, className }) {
  const w = 64
  const h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / range) * (h - 4) - 2])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={cn('shrink-0 overflow-visible', className)} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.08" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
