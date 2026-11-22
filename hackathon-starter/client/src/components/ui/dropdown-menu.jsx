import { DropdownMenu as DM } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Dropdown menu (Radix) — shadcn-style composition.
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><Button>Open</Button></DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuLabel>Account</DropdownMenuLabel>
 *       <DropdownMenuItem onSelect={…}><User /> Profile</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem destructive>Delete</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */
export const DropdownMenu = DM.Root
export const DropdownMenuTrigger = DM.Trigger
export const DropdownMenuGroup = DM.Group

export function DropdownMenuContent({ className, sideOffset = 6, align = 'start', children, ...props }) {
  return (
    <DM.Portal>
      <DM.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg',
          'origin-(--radix-dropdown-menu-content-transform-origin)',
          'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
          className,
        )}
        {...props}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  )
}

const itemClass = cn(
  'relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
  'transition-colors data-highlighted:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
  '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
)

export function DropdownMenuItem({ className, destructive, shortcut, children, ...props }) {
  return (
    <DM.Item
      className={cn(itemClass, destructive && 'text-destructive [&_svg]:text-destructive data-highlighted:bg-destructive/10', className)}
      {...props}
    >
      {children}
      {shortcut && <span className="ml-auto pl-4 font-mono text-[11px] text-muted-foreground">{shortcut}</span>}
    </DM.Item>
  )
}

export function DropdownMenuCheckboxItem({ className, children, checked, ...props }) {
  return (
    <DM.CheckboxItem checked={checked} className={cn(itemClass, 'pl-8', className)} {...props}>
      <span className="absolute left-2 grid size-4 place-items-center">
        <DM.ItemIndicator>
          <Check className="text-foreground!" />
        </DM.ItemIndicator>
      </span>
      {children}
    </DM.CheckboxItem>
  )
}

export function DropdownMenuLabel({ className, ...props }) {
  return <DM.Label className={cn('px-2 pt-1.5 pb-1 eyebrow', className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <DM.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}
