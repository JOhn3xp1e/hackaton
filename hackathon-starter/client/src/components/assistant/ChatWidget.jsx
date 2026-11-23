import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Bot, RotateCcw, SendHorizontal, Sparkles, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { chatService } from '@/services/chatService'

const STORAGE_KEY = 'cf-assistant-chat'
const MAX_HISTORY = 20 // must match MAX_CHAT_MESSAGES on the server

const SUGGESTIONS = [
  'Give me an overview of open issues',
  "What's broken in the labs right now?",
  'Which category is reported most?',
  'Top students by credits',
]

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    /* storage unavailable (private mode) — chat still works in memory */
  }
}

/** **bold** and CF-000123 → ticket links, inside one line of text. */
function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\bCF-\d{6}\b)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (/^CF-\d{6}$/.test(part)) {
      return (
        <Link key={i} to={`/tickets/${part}`} className="font-mono font-medium text-primary underline underline-offset-2 hover:opacity-80">
          {part}
        </Link>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

/** Minimal Markdown: paragraphs, "-"/"*"/"1." lists, **bold**, ticket links. */
function RichText({ text }) {
  const blocks = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (item) {
      const last = blocks.at(-1)
      if (last?.type === 'list') last.items.push(item[1])
      else blocks.push({ type: 'list', items: [item[1]] })
    } else {
      blocks.push({ type: 'p', text: line.replace(/^#+\s*/, '') })
    }
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === 'list' ? (
          <ul key={i} className="list-disc space-y-1 pl-4 marker:text-muted-foreground">
            {b.items.map((t, j) => (
              <li key={j}>
                <Inline text={t} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        ),
      )}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1" aria-label="Assistant is thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

/**
 * Floating staff assistant powered by Groq. Answers questions about reports
 * from live database data via POST /api/chat. Rendered for staff only.
 */
export function ChatWidget() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => saveHistory(messages), [messages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending, error, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(history) {
    setPending(true)
    setError(null)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const { reply } = await chatService.ask(history.slice(-MAX_HISTORY), { signal: controller.signal })
      setMessages([...history, { role: 'assistant', content: reply }])
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err.message || 'Something went wrong')
      toast.error('Assistant unavailable', { description: err.message })
    } finally {
      if (abortRef.current === controller) setPending(false)
    }
  }

  function submit(text) {
    const content = text.trim()
    if (!content || pending) return
    const next = [...messages, { role: 'user', content: content.slice(0, 2000) }]
    setMessages(next)
    setInput('')
    send(next)
  }

  function clear() {
    abortRef.current?.abort()
    setPending(false)
    setError(null)
    setMessages([])
    inputRef.current?.focus()
  }

  const lastIsUser = messages.at(-1)?.role === 'user'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="CampusFix Assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-2xl',
              'inset-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-2xl',
            )}
          >
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-[15px] font-semibold leading-tight">CampusFix Assistant</h2>
                <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Live report data · Powered by Groq</p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            {/* Messages */}
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-relaxed">
              {messages.length === 0 && !pending && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                    <Sparkles className="size-6" />
                  </div>
                  <div>
                    <p className="font-medium">Ask about campus reports</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Answers come from live tickets, rooms, equipment and credits.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="rounded-xl border border-border px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 break-words',
                      m.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-foreground whitespace-pre-wrap'
                        : 'rounded-bl-md bg-muted text-foreground',
                    )}
                  >
                    {m.role === 'user' ? m.content : <RichText text={m.content} />}
                  </div>
                </div>
              ))}

              {pending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5">
                    <TypingDots />
                  </div>
                </div>
              )}

              {error && !pending && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  <p>{error}</p>
                  {lastIsUser && (
                    <button onClick={() => send(messages)} className="mt-1.5 inline-flex items-center gap-1 font-medium underline underline-offset-2">
                      <RotateCcw className="size-3" /> Try again
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit(input)
              }}
              className="flex items-end gap-2 border-t border-border p-3"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit(input)
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="e.g. What's still open in CL2?"
                aria-label="Ask the assistant"
                className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || pending}
                aria-label="Send"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <SendHorizontal className="size-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close assistant' : 'Open CampusFix Assistant'}
        aria-expanded={open}
        className={cn(
          'fixed right-4 bottom-4 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/15 sm:right-6 sm:bottom-6',
          open && 'max-sm:hidden',
        )}
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </motion.button>
    </>
  )
}
