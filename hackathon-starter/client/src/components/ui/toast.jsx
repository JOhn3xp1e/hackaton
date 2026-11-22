import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn, uid } from '@/lib/utils'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <AlertCircle className="size-4 text-destructive" />,
  warning: <TriangleAlert className="size-4 text-warning" />,
  info: <Info className="size-4 text-info" />,
  default: null,
}

/**
 * Toast notifications — no extra dependency.
 *
 *   const toast = useToast()
 *   toast.success('Saved', { description: 'Item created.' })
 *   toast.error('Failed', { description: err.message })
 *   toast({ title: 'Hello', action: { label: 'Undo', onClick } })
 */
export function ToastProvider({ children, duration = 4000, max = 4 }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const show = useCallback(
    (opts) => {
      const id = uid()
      const toast = { id, type: 'default', duration, ...opts }
      setToasts((t) => [...t, toast].slice(-max))
      if (toast.duration !== Infinity) {
        timers.current.set(id, setTimeout(() => dismiss(id), toast.duration))
      }
      return id
    },
    [dismiss, duration, max],
  )

  const api = useMemo(() => {
    const fn = (opts) => show(typeof opts === 'string' ? { title: opts } : opts)
    for (const type of ['success', 'error', 'warning', 'info']) {
      fn[type] = (title, opts = {}) => show({ ...opts, title, type })
    }
    fn.dismiss = dismiss
    return fn
  }, [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function Toaster({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-popover p-3.5 pr-10 text-popover-foreground shadow-lg relative',
            )}
          >
            {ICONS[t.type] && <span className="mt-0.5">{ICONS[t.type]}</span>}
            <div className="grid min-w-0 flex-1 gap-0.5">
              {t.title && <p className="text-sm font-medium leading-snug">{t.title}</p>}
              {t.description && <p className="text-[13px] text-muted-foreground leading-snug">{t.description}</p>}
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick?.()
                    onDismiss(t.id)
                  }}
                  className="mt-1.5 w-fit text-[13px] font-medium text-primary hover:underline underline-offset-4"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
