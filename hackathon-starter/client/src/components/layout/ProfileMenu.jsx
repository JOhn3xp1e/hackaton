import { useNavigate } from 'react-router'
import { ClipboardList, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { ROLES } from '@/lib/constants'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ProfileMenu() {
  const navigate = useNavigate()
  const toast = useToast()
  const { theme, setTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const name = profile?.full_name || user?.email || ''

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error('Could not sign out', { description: err.message })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full p-0.5 pr-0.5 transition-colors hover:bg-accent sm:rounded-md sm:pr-2.5" aria-label="Open profile menu">
          <Avatar name={name} size="sm" />
          <span className="hidden text-left sm:grid">
            <span className="max-w-40 truncate text-[13px] font-medium leading-tight">{name}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{ROLES[profile?.role] ?? ''}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-[12.5px] text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/my-reports')}>
          <ClipboardList /> My reports
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        {[
          ['light', 'Light', Sun],
          ['dark', 'Dark', Moon],
          ['system', 'System', Monitor],
        ].map(([value, label, Icon]) => (
          <DropdownMenuCheckboxItem key={value} checked={theme === value} onCheckedChange={() => setTheme(value)}>
            <Icon /> {label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={handleSignOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
