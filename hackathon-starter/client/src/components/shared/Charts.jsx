import { useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn, formatCompact, formatNumber } from '@/lib/utils'

/**
 * Lightweight, dependency-free charts that follow the design tokens.
 * Need something heavier (pie, scatter, zoom)? `npm i recharts` and use the
 * same CSS variables (var(--chart-1) …) for colors.
 */

function niceMax(v) {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  const n = v / exp
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * exp
}

function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const cx = (x0 + x1) / 2
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  return d
}

/**
 * AreaChart — responsive line/area chart with hover tooltip.
 *   <AreaChart data={[{ label: 'Jan', revenue: 10, costs: 6 }]}
 *              series={[{ key: 'revenue', label: 'Revenue', color: 'var(--chart-1)' },
 *                       { key: 'costs', label: 'Costs', color: 'var(--chart-2)', dashed: true }]} />
 */
export function AreaChart({ data = [], series = [], height = 240, format = formatNumber, className }) {
  const ref = useRef(null)
  const uid = 'c' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [hover, setHover] = useState(null)
  const H = 100
  const W = 100

  const max = useMemo(() => niceMax(Math.max(0, ...data.flatMap((d) => series.map((s) => d[s.key] ?? 0)))), [data, series])
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const x = (i) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * W)
  const y = (v) => H - (v / max) * H

  const onMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || !data.length) return
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * (data.length - 1)))
  }

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        {/* Y axis */}
        <div className="relative w-9 text-right font-mono text-[10.5px] text-muted-foreground tabular" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / max) * 100}%` }}>
              {formatCompact(t)}
            </span>
          ))}
        </div>

        <div className="grid gap-2">
          <div
            ref={ref}
            className="relative"
            style={{ height }}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {/* Grid lines */}
            {ticks.map((t) => (
              <div
                key={t}
                className={cn('absolute inset-x-0 border-t', t === 0 ? 'border-border' : 'border-dashed border-border/70')}
                style={{ top: `${100 - (t / max) * 100}%` }}
              />
            ))}

            {/* Left-to-right wipe reveal (clip-path; pathLength conflicts with non-scaling-stroke) */}
            <motion.svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
              initial={{ clipPath: 'inset(-10% 100% -10% 0)' }}
              animate={{ clipPath: 'inset(-10% 0% -10% 0)' }}
              transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            >
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                  </linearGradient>
                ))}
              </defs>
              {series.map((s, si) => {
                const pts = data.map((d, i) => [x(i), y(d[s.key] ?? 0)])
                const line = smoothPath(pts)
                return (
                  <g key={s.key}>
                    {!s.dashed && (
                      <motion.path
                        d={`${line} L${W},${H} L0,${H} Z`}
                        fill={`url(#${uid}-${s.key})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 + si * 0.1 }}
                      />
                    )}
                    <path
                      d={line}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="1.75"
                      strokeDasharray={s.dashed ? '4 4' : undefined}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                    />
                  </g>
                )
              })}
            </motion.svg>

            {/* Hover crosshair, dots and tooltip (HTML so they never distort) */}
            <AnimatePresence>
              {hover !== null && data[hover] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <div className="pointer-events-none absolute inset-y-0 w-px bg-foreground/15" style={{ left: `${x(hover)}%` }} />
                  {series.map((s) => (
                    <span
                      key={s.key}
                      className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                      style={{ left: `${x(hover)}%`, top: `${y(data[hover][s.key] ?? 0)}%`, background: s.color }}
                    />
                  ))}
                  <div
                    className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-md border border-border bg-popover px-3 py-2 shadow-md"
                    style={{
                      left: `${x(hover)}%`,
                      transform: `translateX(${x(hover) > 60 ? 'calc(-100% - 12px)' : '12px'})`,
                    }}
                  >
                    <p className="eyebrow mb-1">{data[hover].label}</p>
                    {series.map((s) => (
                      <p key={s.key} className="flex items-center justify-between gap-4 text-[12.5px]">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                          {s.label}
                        </span>
                        <span className="font-medium tabular">{format(data[hover][s.key] ?? 0)}</span>
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* X axis */}
          <div className="relative h-4 font-mono text-[10.5px] text-muted-foreground">
            {data.map((d, i) =>
              data.length > 8 && i % 2 ? null : (
                <span
                  key={d.label}
                  className={cn('absolute -translate-x-1/2 whitespace-nowrap', i === 0 && 'translate-x-0', i === data.length - 1 && '-translate-x-full')}
                  style={{ left: `${x(i)}%` }}
                >
                  {d.label}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * BarChart — simple vertical bars.
 *   <BarChart data={[{ label: 'Mon', value: 12 }]} />
 */
export function BarChart({ data = [], height = 180, color = 'var(--chart-1)', format = formatNumber, className }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const [hover, setHover] = useState(null)

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={d.label}
            className="relative flex h-full flex-1 items-end"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            <motion.div
              className="w-full rounded-t-[3px]"
              style={{ background: color, opacity: hover === null || hover === i ? 1 : 0.35 }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            />
            {hover === i && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[11px] font-medium text-background tabular whitespace-nowrap">
                {format(d.value)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border pt-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center font-mono text-[10.5px] text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
