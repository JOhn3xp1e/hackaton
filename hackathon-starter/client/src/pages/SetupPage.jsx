import { Database } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

/** Shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. */
export default function SetupPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <Logo />
        <div className="mt-6 flex items-center gap-2 text-warning">
          <Database className="size-5" />
          <h1 className="font-display text-lg font-semibold text-foreground">Connect Supabase to continue</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          CampusFix stores reports, photos and accounts in Supabase. Add your project keys and restart the dev server.
        </p>
        <ol className="mt-5 grid gap-3 text-sm">
          <li>
            <span className="font-medium">1.</span> Copy <code className="font-mono text-[12.5px]">client/.env.example</code> to{' '}
            <code className="font-mono text-[12.5px]">client/.env</code>
          </li>
          <li>
            <span className="font-medium">2.</span> Set <code className="font-mono text-[12.5px]">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-[12.5px]">VITE_SUPABASE_ANON_KEY</code> (Supabase → Project Settings → API)
          </li>
          <li>
            <span className="font-medium">3.</span> Run <code className="font-mono text-[12.5px]">database/schema.sql</code> then{' '}
            <code className="font-mono text-[12.5px]">database/seed.sql</code> in the Supabase SQL editor
          </li>
          <li>
            <span className="font-medium">4.</span> Restart with <code className="font-mono text-[12.5px]">npm run dev</code>
          </li>
        </ol>
      </div>
    </div>
  )
}
