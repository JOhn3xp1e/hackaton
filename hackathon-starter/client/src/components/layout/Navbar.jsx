import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { SearchBar } from '@/components/shared/SearchBar'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { NotificationsMenu } from './NotificationsMenu'
import { ProfileMenu } from './ProfileMenu'

/** Top navigation bar: mobile menu, breadcrumbs, global search, theme, notifications, profile. */
export function Navbar({ onMenuClick }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const onSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/items?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu />
      </Button>

      <Breadcrumbs className="hidden md:flex" />

      <div className="ml-auto flex items-center gap-1.5">
        <form onSubmit={onSearch} className="hidden w-64 sm:block">
          <SearchBar value={query} onChange={setQuery} placeholder="Search items…" shortcut />
        </form>
        <ThemeToggle />
        <NotificationsMenu />
        <div className="mx-1.5 hidden h-6 w-px bg-border sm:block" />
        <ProfileMenu />
      </div>
    </header>
  )
}
