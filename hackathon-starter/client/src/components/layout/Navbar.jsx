import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { LogIn, Menu } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useDataMode } from '@/providers/DataModeProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { SearchBar } from '@/components/shared/SearchBar'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Logo } from '@/components/shared/Logo'
import { NotificationsMenu } from './NotificationsMenu'
import { ProfileMenu } from './ProfileMenu'

/** Top bar: mobile menu, breadcrumbs, search, theme, and staff sign-in / profile. */
export function Navbar({ onMenuClick }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isStaff, isLoading } = useAuth()
  const { showDemo } = useDataMode()

  // A ticket number jumps straight to the ticket; anything else searches a list.
  const onSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (/^CF-?\d{3,}$/i.test(q)) {
      const digits = q.replace(/\D/g, '').padStart(6, '0')
      navigate(`/tickets/CF-${digits}`)
    } else {
      navigate(`/tickets?search=${encodeURIComponent(q)}`)
    }
    setQuery('')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {onMenuClick ? (
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu />
        </Button>
      ) : (
        // No sidebar for students: the brand lives in the top bar instead.
        <Link to="/" aria-label="CampusFix home">
          <Logo />
        </Link>
      )}

      {onMenuClick && <Breadcrumbs className="hidden md:flex" />}

      <div className="ml-auto flex items-center gap-1.5">
        {/* Search is a staff tool; students only report. */}
        {isStaff && (
          <form onSubmit={onSearch} className="hidden w-64 sm:block">
            <SearchBar value={query} onChange={setQuery} placeholder="Ticket # or keyword…" shortcut />
          </form>
        )}
        {/* Settings → Data mode: flag demo data so it's never mistaken for real reports */}
        {showDemo && (
          <Badge variant="warning" dot className="hidden sm:inline-flex" title="Seeded demo data is visible (Settings → Data mode)">
            Mock data
          </Badge>
        )}
        <ThemeToggle />
        {user ? (
          <>
            {isStaff && <NotificationsMenu />}
            <div className="mx-1.5 hidden h-6 w-px bg-border sm:block" />
            <ProfileMenu />
          </>
        ) : (
          !isLoading && (
            <Button asChild variant="outline" size="sm" className="ml-1">
              <Link to={`/login?next=${encodeURIComponent(location.pathname === '/' ? '/dashboard' : location.pathname)}`}>
                <LogIn /> <span className="hidden sm:inline">Staff sign in</span>
              </Link>
            </Button>
          )
        )}
      </div>
    </header>
  )
}
