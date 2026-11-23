import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { GraduationCap, MailCheck, Presentation, UserPlus } from 'lucide-react'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { safeNext } from './LoginPage'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  role: z.enum(['student', 'teacher'], { message: 'Choose one' }),
})

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'teacher', label: 'Teacher', icon: Presentation },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const { user, isLoading, signUp } = useAuth()
  const [confirmEmail, setConfirmEmail] = useState(null)

  const form = useForm({
    schema,
    initialValues: { fullName: '', email: '', password: '', role: 'student' },
    onSubmit: async (values) => {
      const { needsConfirmation } = await signUp(values)
      if (needsConfirmation) setConfirmEmail(values.email)
      else navigate(next, { replace: true })
    },
  })

  if (!isLoading && user) return <Navigate to={next} replace />

  if (confirmEmail) {
    return (
      <AuthLayout title="Check your inbox" description={`We sent a confirmation link to ${confirmEmail}.`}>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <span className="text-muted-foreground">
            Click the link in the email, then come back and sign in. Staff accounts (maintenance, lab assistants) are upgraded by an
            administrator after sign-up.
          </span>
        </div>
        <Button asChild variant="outline">
          <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>Back to sign in</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" description="Report broken equipment and get updates when it's fixed.">
      <form onSubmit={form.handleSubmit} noValidate className="grid gap-4">
        <Field label="I am a" error={form.errors.role} required>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Role">
            {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = form.values.role === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => form.setValue('role', value)}
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors',
                    active ? 'border-primary bg-primary/8 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Full name" htmlFor="fullName" error={form.errors.fullName} required>
          <Input autoComplete="name" placeholder="Juan Dela Cruz" autoFocus {...form.register('fullName')} />
        </Field>
        <Field label="Email" htmlFor="email" error={form.errors.email} required>
          <Input type="email" autoComplete="email" placeholder="you@school.edu" {...form.register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.errors.password} hint="At least 8 characters." required>
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        {form.errors._form && (
          <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {form.errors._form}
          </p>
        )}
        <Button type="submit" size="lg" loading={form.isSubmitting} leftIcon={<UserPlus />}>
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
