import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const inputBase = cn(
  'w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs',
  'placeholder:text-muted-foreground/80',
  'transition-[border-color,box-shadow] duration-150',
  'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/15',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15',
)

/** Text input. Pass `leftIcon` to render an icon inside the field. */
export const Input = forwardRef(function Input({ className, type = 'text', leftIcon, ...props }, ref) {
  if (leftIcon) {
    return (
      <div className="relative w-full">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
          {leftIcon}
        </span>
        <input ref={ref} type={type} className={cn(inputBase, 'h-9 pl-9', className)} {...props} />
      </div>
    )
  }
  return <input ref={ref} type={type} className={cn(inputBase, 'h-9', className)} {...props} />
})
