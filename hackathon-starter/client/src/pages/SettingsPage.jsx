import { useEffect, useState } from 'react'
import { CircleCheck, CircleX, Monitor, Moon, PlugZap, Sun } from 'lucide-react'
import { useForm } from '@/hooks/useForm'
import { useTheme } from '@/providers/ThemeProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { profileSchema } from '@/lib/schemas'
import { ROLES } from '@/lib/constants'
import { config } from '@/lib/config'
import { cn } from '@/lib/utils'
import { healthService } from '@/services/healthService'
import { profilesService } from '@/services/profilesService'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormContainer, FormSection } from '@/components/shared/FormContainer'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataModeCard } from '@/components/settings/DataModeCard'

export default function SettingsPage() {
  const toast = useToast()
  const { theme, setTheme } = useTheme()
  const { user, profile, setProfile, isAdmin } = useAuth()
  const [health, setHealth] = useState({ state: 'idle' })

  const form = useForm({
    schema: profileSchema,
    initialValues: { fullName: profile?.full_name ?? '' },
    onSubmit: async ({ fullName }) => {
      const updated = await profilesService.updateName(user.id, fullName)
      setProfile(updated)
      toast.success('Profile saved')
    },
  })

  useEffect(() => {
    form.reset({ fullName: profile?.full_name ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

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
      <PageHeader breadcrumbs title="Settings" description="Your profile, appearance and system status." />

      <div className="grid grid-cols-1 gap-6">
        <FormContainer
          title="Profile"
          description="Your name is shown on reports and status updates."
          onSubmit={form.handleSubmit}
          isSubmitting={form.isSubmitting}
          error={form.errors._form}
          submitLabel="Save profile"
          onCancel={() => form.reset({ fullName: profile?.full_name ?? '' })}
          cancelLabel="Reset"
        >
          <FormSection title="Personal info">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName" error={form.errors.fullName} required>
                <Input autoComplete="name" {...form.register('fullName')} />
              </Field>
              <Field label="Email" htmlFor="email" hint="Managed by your sign-in account.">
                <Input id="email" value={user?.email ?? ''} disabled readOnly />
              </Field>
            </div>
            <Field label="Role" hint="Staff roles (maintenance, lab assistant, admin) are granted by an administrator.">
              <div>
                <Badge variant="primary">{ROLES[profile?.role] ?? '—'}</Badge>
              </div>
            </Field>
          </FormSection>
        </FormContainer>

        <div className="grid gap-6 lg:grid-cols-2">
          {isAdmin && <DataModeCard />}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Saved on this device.</CardDescription>
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
                  Test server
                </Button>
              }
            >
              <CardTitle>System status</CardTitle>
              <CardDescription>Integrations used by CampusFix.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2.5 text-sm">
              <Row label="Supabase" value={<Badge variant={config.supabaseUrl ? 'success' : 'outline'} dot>{config.supabaseUrl ? 'Connected' : 'Not configured'}</Badge>} />
              <Row label="API URL" value={<code className="font-mono text-[12.5px]">{config.apiUrl}</code>} />
              <Row
                label="Server"
                value={
                  health.state === 'ok' ? (
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <CircleCheck className="size-4" /> Online
                    </span>
                  ) : health.state === 'error' ? (
                    <span className="inline-flex items-center gap-1.5 text-destructive">
                      <CircleX className="size-4" /> {health.error.message}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not tested</span>
                  )
                }
              />
              <Row
                label="AI triage (Claude)"
                value={
                  health.state === 'ok' ? (
                    <Badge variant={health.data?.aiTriage ? 'success' : 'warning'} dot>
                      {health.data?.aiTriage ? 'Enabled' : 'No API key'}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
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
