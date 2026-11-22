import { cn } from '@/lib/utils'

export function Label({ className, required, children, ...props }) {
  return (
    <label className={cn('text-[13px] font-medium leading-none text-foreground', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  )
}
