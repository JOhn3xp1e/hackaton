import { forwardRef, useId } from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Checkbox (Radix). `checked` can be true | false | 'indeterminate'.
 *   <Checkbox label="Email me" checked={v} onCheckedChange={setV} />
 */
export const Checkbox = forwardRef(function Checkbox({ className, label, description, id, ...props }, ref) {
  const autoId = useId()
  const cbId = id || autoId

  const box = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={cbId}
      className={cn(
        'peer mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border border-input bg-card shadow-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        {props.checked === 'indeterminate' ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (!label) return box

  return (
    <div className="flex items-start gap-2.5">
      {box}
      <label htmlFor={cbId} className="grid gap-0.5 text-sm leading-snug select-none">
        <span className="font-medium">{label}</span>
        {description && <span className="text-muted-foreground text-[13px]">{description}</span>}
      </label>
    </div>
  )
})
