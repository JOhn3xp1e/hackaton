import { Suspense, useEffect, useState } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { pageVariants } from '@/lib/motion'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PageLoader } from '@/components/feedback/LoadingSkeleton'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useAuth } from '@/providers/AuthProvider'
import { ChatWidget } from '@/components/assistant/ChatWidget'

/**
 * App shell: sidebar + navbar + animated page outlet on a blueprint grid.
 */
export function AppLayout() {
  const location = useLocation()
  const outlet = useOutlet()
  const [collapsed, setCollapsed] = useLocalStorage('cf-sidebar-collapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isStaff } = useAuth()

  // Close mobile drawer and scroll to top on navigation
  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Blueprint grid backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-105 bg-blueprint mask-fade-b" />

        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ErrorBoundary key={location.pathname}>
                  <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="relative border-t border-border px-4 py-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>CampusFix · Campus facility reporting</span>
            <span className="hidden sm:inline">Report it. Track it. Fixed.</span>
          </div>
        </footer>
      </div>

      {/* Staff-only Groq assistant (reads live report data) */}
      {isStaff && <ChatWidget />}
    </div>
  )
}
