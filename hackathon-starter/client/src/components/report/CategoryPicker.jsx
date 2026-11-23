import { Sparkles } from 'lucide-react'
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** Grid of large, tappable category tiles. */
export function CategoryPicker({ value, onChange, aiValue }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Category">
      {CATEGORY_KEYS.map((key) => {
        const { short, icon: Icon } = CATEGORIES[key]
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3.5 text-center text-[13px] font-medium transition-colors',
              active
                ? 'border-primary bg-primary/8 text-primary ring-2 ring-primary/20'
                : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
            )}
          >
            {aiValue === key && (
              <Sparkles className="absolute right-2 top-2 size-3.5 text-primary" aria-label="AI suggestion" />
            )}
            <Icon className="size-5" strokeWidth={1.75} />
            {short}
          </button>
        )
      })}
    </div>
  )
}
