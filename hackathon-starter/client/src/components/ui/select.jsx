import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputBase } from './input'

/**
 * Select — styled native <select>. Native is the most robust choice for
 * forms, mobile and accessibility, and works with useForm().register().
 *
 *   <Select options={[{ value: 'a', label: 'Option A' }]} placeholder="Choose…" />
 *   or pass <option> children yourself.
 */
export const Select = forwardRef(function Select(
  { className, options, placeholder, children, size = 'md', ...props },
  ref,
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(inputBase, 'appearance-none pr-9', size === 'sm' ? 'h-8 text-[13px]' : 'h-9', className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((o) => {
              const opt = typeof o === 'string' ? { value: o, label: o } : o
              return (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              )
            })
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
})
