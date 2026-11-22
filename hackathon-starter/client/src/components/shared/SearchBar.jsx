import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputBase } from '@/components/ui/input'

/**
 * SearchBar — controlled search input with clear button and optional "/" shortcut.
 *   const [q, setQ] = useState('')
 *   const debounced = useDebounce(q)
 *   <SearchBar value={q} onChange={setQ} shortcut />
 */
export function SearchBar({ value, onChange, placeholder = 'Search…', shortcut = false, className, inputClassName, ...props }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange?.('')}
        placeholder={placeholder}
        className={cn(inputBase, 'h-9 pl-9 pr-16 [&::-webkit-search-cancel-button]:hidden', inputClassName)}
        {...props}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <AnimatePresence>
          {value && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                onChange?.('')
                ref.current?.focus()
              }}
              aria-label="Clear search"
              className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
        {shortcut && !value && (
          <kbd className="hidden rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground sm:inline-block">
            /
          </kbd>
        )}
      </div>
    </div>
  )
}
