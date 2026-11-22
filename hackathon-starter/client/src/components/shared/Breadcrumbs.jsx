import { Fragment } from 'react'
import { Link, useLocation } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { routeLabels } from '@/data/navigation'

function useAutoCrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Home', to: '/' }]
  parts.forEach((part, i) => {
    const to = '/' + parts.slice(0, i + 1).join('/')
    crumbs.push({ label: routeLabels[to] || decodeURIComponent(part).replace(/[-_]/g, ' '), to })
  })
  return crumbs
}

/**
 * Breadcrumbs — pass `items` ([{ label, to }]) or let it derive from the URL.
 */
export function Breadcrumbs({ items, className }) {
  const auto = useAutoCrumbs()
  const crumbs = items ?? auto

  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={c.to ?? c.label}>
              <li>
                {last || !c.to ? (
                  <span aria-current={last ? 'page' : undefined} className={cn('capitalize', last && 'text-foreground font-medium')}>
                    {c.label}
                  </span>
                ) : (
                  <Link to={c.to} className="capitalize transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                )}
              </li>
              {!last && (
                <li aria-hidden>
                  <ChevronRight className="size-3.5 opacity-60" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
