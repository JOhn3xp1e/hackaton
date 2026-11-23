import { useState } from 'react'
import { NavLink } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronFirst, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { navForRole } from '@/data/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { Tooltip } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const EXPANDED = 264
const COLLAPSED = 76

const EASE_OUT = [0.16, 1, 0.3, 1]
const SPRING = { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 }

/* ───────────────────────────── Brand ───────────────────────────── */

const MARK_PATHS = [
  'M3 8V5a2 2 0 0 1 2-2h3',
  'M16 3h3a2 2 0 0 1 2 2v3',
  'M21 16v3a2 2 0 0 1-2 2h-3',
  'M8 21H5a2 2 0 0 1-2-2v-3',
]

/** The scan-frame mark draws itself in, then the "+" pops. Spins a quarter turn on hover. */
function AnimatedMark() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7 shrink-0 text-primary"
      aria-hidden
      variants={{ hover: { rotate: 90, scale: 1.06 } }}
      transition={SPRING}
    >
      {MARK_PATHS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
        />
      ))}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.5 }}
        style={{ transformOrigin: '12px 12px' }}
      >
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </motion.g>
    </motion.svg>
  )
}

function Brand({ collapsed }) {
  return (
    <div className={cn('px-6 pt-7 pb-6', collapsed && 'flex justify-center px-0')}>
      <motion.div whileHover="hover" className="w-fit">
        <NavLink to="/" className="flex items-center gap-3" aria-label={`${config.appName} home`}>
          <AnimatedMark />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="wordmark"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="truncate font-display text-[22px] font-bold leading-none tracking-tight"
              >
                {config.appName}
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </motion.div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.p
            key="tagline"
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '0.12em' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
            className="mt-3 overflow-hidden whitespace-nowrap font-mono text-[10px] text-muted-foreground uppercase"
          >
            Report · Track · Resolve
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────────── Navigation ───────────────────────────── */

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.15 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } },
}

function NavItems({ collapsed, onNavigate, idPrefix }) {
  const { profile } = useAuth()
  const sections = navForRole(profile?.role)
  const [hovered, setHovered] = useState(null)

  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4" onMouseLeave={() => setHovered(null)}>
      {sections.map((section) => (
        <div key={section.title} className="mb-6 last:mb-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: collapsed ? 0 : 1 }}
            transition={{ duration: 0.25 }}
            className="mb-3 h-4 px-3 font-mono text-[11px] tracking-[0.1em] whitespace-nowrap text-muted-foreground uppercase"
          >
            {section.title}
          </motion.p>
          {/* Keyed by role so the stagger replays once the profile (and its items) loads */}
          <motion.ul key={profile?.role ?? 'guest'} className="grid gap-1" variants={listVariants} initial="hidden" animate="show">
            {section.items.map((item) => (
              <motion.li key={item.to} variants={itemVariants}>
                <Tooltip content={collapsed ? item.label : null} side="right">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    onMouseEnter={() => setHovered(item.to)}
                    onFocus={() => setHovered(item.to)}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex h-11 items-center gap-3.5 rounded-lg px-3 text-[14.5px] outline-none transition-colors duration-200',
                        collapsed && 'justify-center px-0',
                        isActive ? 'font-medium text-primary' : 'text-foreground/75 hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Hover highlight glides between items */}
                        <AnimatePresence>
                          {hovered === item.to && !isActive && (
                            <motion.span
                              layoutId={`${idPrefix}-hover`}
                              className="absolute inset-0 rounded-lg bg-muted"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={SPRING}
                            />
                          )}
                        </AnimatePresence>
                        {/* Active pill springs to the current page */}
                        {isActive && (
                          <motion.span
                            layoutId={`${idPrefix}-active`}
                            className="absolute inset-0 rounded-lg bg-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_12%,transparent)]"
                            transition={SPRING}
                          />
                        )}
                        <motion.span
                          className="relative grid place-items-center"
                          animate={isActive ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                          transition={{ duration: 0.4, ease: EASE_OUT }}
                        >
                          <item.icon
                            className={cn(
                              'size-5 shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110',
                              !isActive && 'text-muted-foreground group-hover:text-foreground',
                            )}
                            strokeWidth={1.75}
                          />
                        </motion.span>
                        <AnimatePresence initial={false}>
                          {!collapsed && (
                            <motion.span
                              key="label"
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.18 }}
                              className="relative truncate transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {!collapsed && item.badge && (
                          <Badge variant="outline" className="relative ml-auto font-mono text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                </Tooltip>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      ))}
    </nav>
  )
}

/* ───────────────────────────── Sidebar ───────────────────────────── */

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
        className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-border bg-card text-sidebar-foreground lg:flex"
      >
        <Brand collapsed={collapsed} />
        <NavItems collapsed={collapsed} idPrefix="sidebar" />

        <div className="px-3 pb-4">
          <Tooltip content={collapsed ? 'Expand sidebar' : null} side="right">
            <button
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={cn(
                'group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-foreground/75 transition-colors hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={SPRING} className="grid place-items-center">
                <ChevronFirst
                  className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
                  strokeWidth={1.75}
                />
              </motion.span>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key="collapse-label"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.18 }}
                    className="truncate whitespace-nowrap"
                  >
                    Collapse sidebar
                  </motion.span>
                )}
              </AnimatePresence>
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
                className="absolute top-6 right-4 grid size-8 place-items-center rounded-md text-muted-foreground transition-transform hover:rotate-90 hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <Brand />
              <NavItems onNavigate={onMobileClose} idPrefix="drawer" />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
