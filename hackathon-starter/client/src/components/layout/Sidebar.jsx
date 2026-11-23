import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronFirst, ChevronLast, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { navForRole } from '@/data/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { healthService } from '@/services/healthService'
import { LogoMark } from '@/components/shared/Logo'
import { Tooltip } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const EXPANDED = 264
const COLLAPSED = 76
const HEALTH_POLL_MS = 60_000

const STATUS = {
  checking: { label: 'Checking systems…', dot: 'bg-muted-foreground', pulse: true },
  ok: { label: 'All systems operational', dot: 'bg-success', pulse: false },
  degraded: { label: 'AI triage unavailable', dot: 'bg-warning', pulse: false },
  down: { label: 'Server unreachable', dot: 'bg-destructive', pulse: true },
}

/** Polls the Express health endpoint so the footer reflects the real backend state. */
function useSystemStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true
    let controller

    const check = async () => {
      controller?.abort()
      controller = new AbortController()
      try {
        const { data } = await healthService.check({ signal: controller.signal })
        if (active) setStatus(data?.status === 'ok' ? (data.aiTriage ? 'ok' : 'degraded') : 'down')
      } catch (err) {
        if (active && err?.name !== 'AbortError') setStatus('down')
      }
    }

    check()
    const timer = setInterval(check, HEALTH_POLL_MS)
    window.addEventListener('focus', check)
    return () => {
      active = false
      controller?.abort()
      clearInterval(timer)
      window.removeEventListener('focus', check)
    }
  }, [])

  return STATUS[status]
}

function Brand({ collapsed }) {
  return (
    <div className={cn('px-6 pt-7 pb-6', collapsed && 'flex justify-center px-0')}>
      <NavLink to="/" className="flex items-center gap-3" aria-label={`${config.appName} home`}>
        <LogoMark />
        {!collapsed && (
          <span className="truncate font-display text-[22px] font-bold leading-none tracking-tight">
            {config.appName}
          </span>
        )}
      </NavLink>
      {!collapsed && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          Report · Track · Resolve
        </p>
      )}
    </div>
  )
}

function NavItems({ collapsed, onNavigate }) {
  const { profile } = useAuth()
  const sections = navForRole(profile?.role)
  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
      {sections.map((section) => (
        <div key={section.title} className="mb-6 last:mb-0">
          <p
            className={cn(
              'mb-3 h-4 px-3 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase transition-opacity',
              collapsed && 'opacity-0',
            )}
          >
            {section.title}
          </p>
          <ul className="grid gap-1">
            {section.items.map((item) => (
              <li key={item.to}>
                <Tooltip content={collapsed ? item.label : null} side="right">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'relative flex h-11 items-center gap-3.5 rounded-lg px-3 text-[14.5px] transition-colors',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'font-medium text-primary'
                          : 'text-foreground/75 hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-accent"
                            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                          />
                        )}
                        <item.icon
                          className={cn('relative size-5 shrink-0', !isActive && 'text-muted-foreground')}
                          strokeWidth={1.75}
                        />
                        {!collapsed && <span className="relative truncate">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <Badge variant="outline" className="relative ml-auto font-mono text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function CampusCard() {
  return (
    <div className="mx-4 rounded-lg bg-accent px-4 py-3.5">
      <p className="font-mono text-[11px] tracking-[0.08em] text-primary uppercase">{config.campusName}</p>
      <p className="mt-1.5 truncate text-[13.5px] text-foreground">{config.campusUnit}</p>
      <p className="mt-1.5 font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground uppercase">
        Campus Network · v {config.appVersion}
      </p>
    </div>
  )
}

function SystemStatus({ status, collapsed }) {
  const dot = (
    <span className="relative flex size-2 shrink-0">
      {status.pulse && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', status.dot)} />}
      <span className={cn('relative size-2 rounded-full', status.dot)} />
    </span>
  )
  return (
    <Tooltip content={collapsed ? status.label : null} side="right">
      <div
        role="status"
        aria-live="polite"
        className={cn('flex items-center gap-2.5 px-6 py-4', collapsed && 'justify-center px-0')}
      >
        {dot}
        {collapsed ? <span className="sr-only">{status.label}</span> : (
          <span className="truncate text-[12.5px] text-muted-foreground">{status.label}</span>
        )}
      </div>
    </Tooltip>
  )
}

/**
 * Sidebar — collapsible on desktop, slide-in drawer on mobile.
 */
export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }) {
  const status = useSystemStatus()

  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-border bg-card text-sidebar-foreground lg:flex"
      >
        <Brand collapsed={collapsed} />
        <NavItems collapsed={collapsed} />
        {!collapsed && <CampusCard />}
        <SystemStatus status={status} collapsed={collapsed} />

        <div className="px-3 pb-4">
          <Tooltip content={collapsed ? 'Expand sidebar' : null} side="right">
            <button
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-foreground/75 transition-colors hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? (
                <ChevronLast className="size-5 shrink-0" strokeWidth={1.75} />
              ) : (
                <ChevronFirst className="size-5 shrink-0" strokeWidth={1.75} />
              )}
              {!collapsed && <span className="truncate">Collapse sidebar</span>}
            </button>
          </Tooltip>
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-lg"
            >
              <button
                onClick={onMobileClose}
                aria-label="Close menu"
                className="absolute top-6 right-4 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <Brand />
              <NavItems onNavigate={onMobileClose} />
              <CampusCard />
              <SystemStatus status={status} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
