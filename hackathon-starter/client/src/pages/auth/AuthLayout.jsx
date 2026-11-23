import { Camera, QrCode, Wrench } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const STEPS = [
  { icon: QrCode, title: 'Scan', body: 'Scan the QR code posted in any classroom or lab.' },
  { icon: Camera, title: 'Report', body: 'Snap a photo and describe what is broken.' },
  { icon: Wrench, title: 'Track', body: 'Follow your ticket until maintenance marks it fixed.' },
]

/** Split-screen shell for /login and /signup. */
export function AuthLayout({ title, description, children, notice }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-blueprint opacity-70" />
        <Logo className="relative" />
        <div className="relative grid gap-8">
          <div className="grid gap-3">
            <p className="eyebrow">Campus facility reporting</p>
            <h2 className="max-w-md font-display text-4xl font-semibold leading-tight tracking-tight text-balance">
              Broken projector? Dead PC? Report it in 30 seconds.
            </h2>
          </div>
          <ul className="grid gap-4">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary">
                  <Icon className="size-4.5" />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">{title}</span>
                  <span className="text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-[11px] text-muted-foreground">Students · Teachers · Lab assistants · Maintenance</p>
      </aside>

      <main className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="mx-auto grid w-full max-w-sm flex-1 content-center gap-6 py-10">
          {notice}
          <div className="grid gap-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
