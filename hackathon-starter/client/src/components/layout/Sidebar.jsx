import { NavLink } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronsLeft, LifeBuoy, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navSections } from '@/data/navigation'
import { Logo } from '@/components/shared/Logo'
import { Tooltip } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const EXPANDED = 256
const COLLAPSED = 72

function NavItems({ collapsed, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
      {navSections.map((section) => (
        <div key={section.title} className="mb-6 last:mb-0">
          <p className={cn('eyebrow mb-2 h-4 px-3 transition-opacity', collapsed && 'opacity-0')}>{section.title}</p>
          <ul className="grid gap-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <Tooltip content={collapsed ? item.label : null} side="right">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-md border border-border bg-card shadow-xs"
                            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                          />
                        )}
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active-bar"
                            className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-primary"
                            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                          />
                        )}
                        <item.icon className="relative size-[18px] shrink-0" strokeWidth={1.75} />
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

function SidebarFooter({ collapsed }) {
  if (collapsed) return null
  return (
    <div className="m-3 rounded-lg border border-border bg-card p-3.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <LifeBuoy className="size-4 text-primary" /> Starter kit
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
        Replace mock data in <code className="font-mono text-[11.5px]">src/services</code> when the API is ready.
      </p>
    </div>
  )
}

/**
 * Sidebar — collapsible on desktop, slide-in drawer on mobile.
 */
export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex"
      >
        <div className={cn('flex h-16 items-center border-b border-border px-5', collapsed && 'justify-center px-0')}>
          <Logo collapsed={collapsed} />
        </div>
        <NavItems collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[52px] z-10 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} className="grid place-items-center">
            <ChevronsLeft className="size-3.5" />
          </motion.span>
        </button>
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
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-sidebar shadow-lg"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <Logo />
                <button onClick={onMobileClose} aria-label="Close menu" className="grid size-8 place-items-center rounded-md hover:bg-accent">
                  <X className="size-4" />
                </button>
              </div>
              <NavItems onNavigate={onMobileClose} />
              <SidebarFooter />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
