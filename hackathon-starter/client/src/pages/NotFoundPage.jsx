import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextReveal } from '@/components/shared/Reveal'

export default function NotFoundPage() {
  return (
    <div className="relative grid min-h-[60vh] place-items-center text-center">
      <div className="grid justify-items-center gap-4">
        <p className="eyebrow">Error 404</p>
        <TextReveal as="h1" text="This page doesn't exist." className="font-display text-3xl font-semibold tracking-tight sm:text-4xl" />
        <p className="max-w-sm text-sm text-muted-foreground">The link may be broken, or the page may have moved.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/">
            <ArrowLeft /> Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
