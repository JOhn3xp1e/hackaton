import { useState } from 'react'
import { CheckCircle2, Monitor, Moon, PlugZap, Sun, XCircle } from 'lucide-react'
import { useForm } from '@/hooks/useForm'
import { useTheme } from '@/providers/ThemeProvider'
import { useToast } from '@/components/ui/toast'
import { profileSchema } from '@/lib/schemas'
import { config } from '@/lib/config'
import { cn, sleep } from '@/lib/utils'
import { healthService } from '@/services/healthService'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormContainer, FormSection } from '@/components/shared/FormContainer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * SETTINGS — demonstrates FormContainer + useForm + Zod validation, theme
 * switching and an API connectivity check.
 */
export default function SettingsPage() {
  const toast = useToast()
  const { theme, setTheme } = useTheme()
  const [health, setHealth] = useState({ state: 'idle' })

  const form = useForm({
    schema: profileSchema,
    initialValues: { fullName: 'Alex Rivera', email: 'alex@example.com', role: 'frontend', bio: '', notifications: true },
    onSubmit: async () => {
      await sleep(700) // replace with: await api.put('/me', values)
      toast.success('Profile saved', { description: 'This demo does not persist data.' })
    },
  })

  const testConnection = async () => {
    setHealth({ state: 'loading' })
    try {
      const { data } = await healthService.check()
      setHealth({ state: 'ok', data })
    } catch (error) {
      setHealth({ state: 'error', error })
    }
  }

  return (
    <>
      <PageHeader breadcrumbs title="Settings" description="Form patterns, theme preferences and environment diagnostics." />

      <div className="grid grid-cols-1 gap-6">
        <FormContainer
          title="Profile"
          description="Validated on blur and on submit with the same Zod schema style the API uses."
          onSubmit={form.handleSubmit}
          isSubmitting={form.isSubmitting}
          error={form.errors._form}
          submitLabel="Save profile"
          onCancel={() => form.reset()}
          cancelLabel="Reset"
        >
          <FormSection title="Personal info" description="Shown to your teammates.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName" error={form.errors.fullName} required>
                <Input {...form.register('fullName')} />
              </Field>
              <Field label="Email" htmlFor="email" error={form.errors.email} required>
                <Input type="email" {...form.register('email')} />
              </Field>
            </div>
            <Field label="Role" htmlFor="role" error={form.errors.role} required>
              <Select
                {...form.register('role')}
                placeholder="Choose…"
                options={[
                  { value: 'frontend', label: 'Frontend developer' },
                  { value: 'backend', label: 'Backend developer' },
                  { value: 'database', label: 'Database developer' },
                ]}
              />
            </Field>
            <Field label="Bio" htmlFor="bio" error={form.errors.bio} hint={`${form.values.bio.length}/280`}>
              <Textarea rows={3} placeholder="A sentence about you" {...form.register('bio')} />
            </Field>
          </FormSection>
          <FormSection title="Notifications" description="How we contact you.">
            <Checkbox
              label="Email notifications"
              description="Receive a digest of activity."
              checked={form.values.notifications}
              onCheckedChange={(v) => form.setValue('notifications', v === true)}
            />
          </FormSection>
        </FormContainer>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Theme is saved in localStorage.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {[
                ['light', 'Light', Sun],
                ['dark', 'Dark', Moon],
                ['system', 'System', Monitor],
              ].map(([value, label, Icon]) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium transition-colors',
                    theme === value ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              action={
                <Button size="sm" variant="outline" leftIcon={<PlugZap />} onClick={testConnection} loading={health.state === 'loading'}>
                  Test API
                </Button>
              }
            >
              <CardTitle>Environment</CardTitle>
              <CardDescription>Values from client/.env</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2.5 text-sm">
              <Row label="API URL" value={<code className="font-mono text-[12.5px]">{config.apiUrl}</code>} />
              <Row label="Data source" value={<Badge variant={config.useMocks ? 'warning' : 'success'} dot>{config.useMocks ? 'Mock data' : 'Real API'}</Badge>} />
              <Row label="Supabase (browser)" value={<Badge variant={config.supabaseUrl ? 'success' : 'outline'}>{config.supabaseUrl ? 'Configured' : 'Not configured'}</Badge>} />
              <Row
                label="API health"
                value={
                  health.state === 'ok' ? (
                    <span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 className="size-4" /> {health.data?.status} · {health.data?.database}</span>
                  ) : health.state === 'error' ? (
                    <span className="inline-flex items-center gap-1.5 text-destructive"><XCircle className="size-4" /> {health.error.message}</span>
                  ) : (
                    <span className="text-muted-foreground">Not tested</span>
                  )
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-border pb-2.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
