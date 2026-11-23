import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, LogIn, SquarePen } from 'lucide-react'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useAuth } from '@/providers/AuthProvider'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

/** Only allow in-app redirects (never an absolute URL from the query string). Staff land on the dashboard. */
export function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const { user, isLoading, signIn } = useAuth()

  const form = useForm({
    schema,
    initialValues: { email: '', password: '' },
    onSubmit: async ({ email, password }) => {
      await signIn(email, password)
      navigate(next, { replace: true })
    },
  })

  if (!isLoading && user) return <Navigate to={next} replace />

  return (
    <AuthLayout
      title="Teacher & staff sign in"
      description="Manage reports, update repair status and review student reports for credits."
      notice={
        <Link
          to="/"
          className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3.5 text-sm transition-colors hover:bg-primary/10"
        >
          <SquarePen className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">Student?</span> You don&apos;t need an account. Report an issue with just your student number →
          </span>
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate className="grid gap-4">
        <Field label="Email" htmlFor="email" error={form.errors.email} required>
          <Input type="email" autoComplete="email" placeholder="you@school.edu" autoFocus {...form.register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.errors.password} required>
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        {form.errors._form && (
          <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {form.errors._form}
          </p>
        )}
        <Button type="submit" size="lg" loading={form.isSubmitting} leftIcon={<LogIn />}>
          Sign in
        </Button>
      </form>
      <div className="grid gap-2 text-center text-sm text-muted-foreground">
        <p>
          Teacher without an account?{' '}
          <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
        <Link to="/" className="inline-flex items-center justify-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to reporting
        </Link>
      </div>
    </AuthLayout>
  )
}
