import { useEffect, useId, useRef, useState } from 'react'
import { Cpu, MapPin, Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { equipmentService } from '@/services/equipmentService'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

/**
 * "What is it?" — search equipment by sticker ID (CL2-PC15), name ("projector")
 * or room ("Computer Laboratory 2"), then pick one. The picked item carries its
 * location, so the reporter never chooses a room separately.
 *
 * `locationId` (from a room QR code) limits results to that room and lists its
 * equipment before anything is typed.
 */
export function EquipmentPicker({ value, onChange, locationId, invalid, disabled }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [active, setActive] = useState(0)
  const debounced = useDebounce(term, 250)
  const listId = useId()
  const inputRef = useRef(null)

  useEffect(() => {
    if (value) return undefined
    if (!debounced.trim() && !locationId) {
      setResults([])
      setError(null)
      return undefined
    }
    let alive = true
    setLoading(true)
    setError(null)
    equipmentService
      .search(debounced, { locationId })
      .then((rows) => {
        if (!alive) return
        setResults(rows)
        setActive(0)
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [debounced, locationId, value])

  const pick = (item) => {
    onChange(item)
    setTerm('')
  }

  if (value) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Cpu className="size-5" />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[12px] font-semibold">{value.short_code}</span>
            <span className="truncate font-semibold">{value.name}</span>
          </span>
          <span className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {value.location?.name} · {value.location?.building}
            {value.location?.floor && ` · ${value.location.floor}`}
          </span>
          {value.description && <span className="text-[12.5px] text-muted-foreground">{value.description}</span>}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => {
            onChange(null)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          leftIcon={<X />}
        >
          Change
        </Button>
      </div>
    )
  }

  const onKeyDown = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active])
    }
  }

  const showList = term.trim() || locationId

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id="equipment"
          type="text"
          role="combobox"
          aria-expanded={Boolean(showList)}
          aria-controls={listId}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          disabled={disabled}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={locationId ? 'Filter this room — e.g. PC15, projector' : 'Equipment ID, name or room — e.g. CL2-PC15'}
          className={cn(
            'h-11 w-full rounded-md border bg-background pl-9 pr-9 text-[15px] shadow-xs outline-none transition-colors',
            'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
            invalid ? 'border-destructive' : 'border-input',
          )}
        />
        {loading && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
      </div>

      {showList && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {error ? (
            <p className="px-3 py-4 text-sm text-destructive">{error}</p>
          ) : !results.length && !loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No equipment matches “{term.trim() || 'this room'}”. Check the ID printed on the sticker.
            </p>
          ) : (
            <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
              {results.map((item, i) => (
                <li key={item.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(item)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                      i === active ? 'bg-accent' : 'hover:bg-accent/60',
                    )}
                  >
                    <span className="w-24 shrink-0 font-mono text-[12.5px] font-semibold">{item.short_code}</span>
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="hidden shrink-0 truncate text-[12px] text-muted-foreground sm:inline">{item.location?.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
