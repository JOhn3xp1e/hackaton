import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { MailCheck, UserPlus } from 'lucide-react'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useAuth } from '@/providers/AuthProvider'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './AuthLayout'
import { safeNext } from './LoginPage'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

/** Teacher sign-up. Every new account is a teacher (= staff); other roles are set by an admin. */
export default function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const { user, isLoading, signUp } = useAuth()
  const [confirmEmail, setConfirmEmail] = useState(null)

  const form = useForm({
    schema,
    initialValues: { fullName: '', email: '', password: '' },
    onSubmit: async (values) => {
      const { needsConfirmation } = await signUp({ ...values, role: 'teacher' })
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
          <span className="text-muted-foreground">Click the link in the email, then come back and sign in.</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create a teacher account"
      description="Teachers can manage reports, update repair status and review student reports. Students don't need an account."
    >
      <form onSubmit={form.handleSubmit} noValidate className="grid gap-4">
        <Field label="Full name" htmlFor="fullName" error={form.errors.fullName} required>
          <Input autoComplete="name" placeholder="Prof. Juan Dela Cruz" autoFocus {...form.register('fullName')} />
        </Field>
        <Field label="School email" htmlFor="email" error={form.errors.email} required>
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
          Create teacher account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
