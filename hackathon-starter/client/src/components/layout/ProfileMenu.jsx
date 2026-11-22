import { useNavigate } from 'react-router'
import { LogOut, Monitor, Moon, Settings, Sun, User } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useTheme } from '@/providers/ThemeProvider'
import { useToast } from '@/components/ui/toast'
import { dashboardService } from '@/services/dashboardService'
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
  const { data: user } = useAsync(() => dashboardService.getCurrentUser().then((r) => r.data), [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full p-0.5 pr-0.5 transition-colors hover:bg-accent sm:rounded-md sm:pr-2.5" aria-label="Open profile menu">
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
          <span className="hidden text-left sm:grid">
            <span className="text-[13px] font-medium leading-tight">{user?.name ?? '…'}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{user?.role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="truncate text-[12.5px] text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings')} shortcut="⌘,">
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
        <DropdownMenuItem destructive onSelect={() => toast.info('Signed out', { description: 'Auth is not wired yet — this is a demo.' })}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
