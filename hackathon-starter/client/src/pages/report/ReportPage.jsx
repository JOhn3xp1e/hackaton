import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { EyeOff, Mail, MapPin, QrCode, Send, Sparkles, UserRound } from 'lucide-react'
import { z } from 'zod'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { CATEGORIES, CATEGORY_KEYS, CREDITS, LOCATION_TYPES, ROLES, SEVERITIES, SEVERITY_KEYS, STUDENT_NO_PATTERN, EMAIL_MAX, EMAIL_PATTERN } from '@/lib/constants'
import { zodErrorsToObject } from '@/lib/schemas'
import { useStudentIdentity } from '@/lib/studentIdentity'
import { cn } from '@/lib/utils'
import { locationsService } from '@/services/locationsService'
import { photosService } from '@/services/photosService'
import { ticketsService } from '@/services/ticketsService'
import { triageService } from '@/services/triageService'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormSection } from '@/components/shared/FormContainer'
import { CategoryPicker } from '@/components/report/CategoryPicker'
import { SeverityPicker } from '@/components/report/SeverityPicker'
import { PhotoPicker } from '@/components/report/PhotoPicker'
import { EquipmentPicker } from '@/components/report/EquipmentPicker'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportSuccess } from './ReportSuccess'

const schema = z.object({
  equipmentId: z.string().uuid("Choose the equipment that's broken"),
  category: z.enum(CATEGORY_KEYS, { message: 'Choose a category' }),
  severity: z.enum(SEVERITY_KEYS, { message: 'Choose how serious it is' }),
  title: z.string().trim().min(3, 'Describe the problem in a few words').max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(2000, 'Keep it under 2000 characters'),
})

// Students report without an account: student number required, name optional.
const studentSchema = z.object({
  studentNo: z.string().trim().regex(STUDENT_NO_PATTERN, 'Enter your student number (e.g. 2000XXXXXX)'),
  reporterName: z.string().trim().max(80, 'Keep it under 80 characters'),
  isAnonymous: z.boolean(),
  reporterEmail: z
    .string()
    .trim()
    .max(EMAIL_MAX, 'Email is too long')
    .refine((v) => !v || EMAIL_PATTERN.test(v), 'Enter a valid email, or leave it empty'),
})

const SECTION = 'border-b border-border px-5 py-5 last:border-b-0 sm:px-6'

const EMPTY = { category: '', severity: 'medium', title: '', description: '' }

export default function ReportPage() {
  const { locationCode, equipmentCode } = useParams()
  const { user, profile, isStaff } = useAuth()
  const toast = useToast()
  const [identity, saveIdentity] = useStudentIdentity()
  const asStaff = Boolean(user && isStaff)

  const [student, setStudent] = useState({
    studentNo: identity.studentNo,
    reporterName: identity.name,
    isAnonymous: identity.anonymous,
    reporterEmail: identity.email,
  })
  const [values, setValues] = useState(EMPTY)
  const [equipment, setEquipment] = useState(null) // picked item, includes its location
  const [errors, setErrors] = useState({})
  const [photos, setPhotos] = useState([])
  const [ai, setAi] = useState(null) // { category, severity, summary }
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  // Room QR code: resolve the room so the equipment search starts with its items.
  const scanned = useAsync(
    async () => {
      if (!locationCode) return null
      const loc = await locationsService.getByCode(decodeURIComponent(locationCode))
      return loc ?? false
    },
    [locationCode],
  )

  // Equipment QR code (/e/<short_code>): pre-select the scanned item.
  const scannedItem = useAsync(
    async () => {
      if (!equipmentCode) return null
      const item = await equipmentService.getByShortCode(decodeURIComponent(equipmentCode))
      if (item) setEquipment(item)
      return item ?? false
    },
    [equipmentCode],
  )

  // The picked equipment carries its location; that's where the ticket goes.
  const location = equipment?.location ?? null

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }
  const setStudentField = (name, value) => {
    setStudent((s) => ({ ...s, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const reset = () => {
    setValues(EMPTY)
    setEquipment(equipmentCode && scannedItem.data ? scannedItem.data : null)
    setPhotos([])
    setAi(null)
    setErrors({})
    setCreated(null)
  }

  const suggest = async () => {
    if (values.title.trim().length < 3) {
      setErrors((e) => ({ ...e, title: 'Write a short title first so AI knows what to triage' }))
      return
    }
    setAiLoading(true)
    try {
      const result = await triageService.suggest({
        title: values.title.trim(),
        description: values.description.trim(),
        assetLabel: equipment ? `${equipment.name} (${equipment.short_code})` : '',
        locationName: location ? `${location.name}, ${location.building}` : '',
      })
      setAi(result)
      setValues((v) => ({ ...v, category: result.category, severity: result.severity }))
      setErrors((e) => ({ ...e, category: undefined, severity: undefined }))
      toast.success('AI suggestion applied', {
        description: `${CATEGORIES[result.category].label} · ${SEVERITIES[result.severity].label}`,
      })
    } catch (err) {
      toast.error('AI triage unavailable', { description: err.message })
    } finally {
      setAiLoading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const parsed = schema.safeParse({ ...values, equipmentId: equipment?.id ?? '' })
    const who = asStaff ? { success: true, data: {} } : studentSchema.safeParse(student)
    if (!parsed.success || !who.success) {
      setErrors({
        ...(parsed.success ? {} : zodErrorsToObject(parsed.error)),
        ...(who.success ? {} : zodErrorsToObject(who.error)),
      })
      toast.error('Please complete the form', { description: 'Some required details are missing.' })
      return
    }
    setSubmitting(true)
    try {
      const studentNo = asStaff ? null : who.data.studentNo.toUpperCase()
      const photoUrls = photos.length ? await photosService.uploadAll(photos, asStaff ? user.id : `students/${studentNo}`) : []
      const ticket = await ticketsService.create({
        ...parsed.data,
        locationId: equipment.location_id,
        assetLabel: equipment.name,
        ...(asStaff
          ? { reporterId: user.id }
          : {
              studentNo,
              reporterName: who.data.reporterName,
              isAnonymous: who.data.isAnonymous,
              reporterEmail: who.data.reporterEmail,
            }),
        photoUrls,
        ai,
      })
      if (!asStaff)
        saveIdentity({ studentNo, name: who.data.reporterName, anonymous: who.data.isAnonymous, email: who.data.reporterEmail })
      setCreated({
        ...ticket,
        title: parsed.data.title,
        locationName: `${equipment.short_code} in ${location?.name ?? 'campus'}`,
        isStudent: !asStaff,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error('Report not submitted', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // "Report an issue" is the students' page; staff landing on "/" go to their dashboard.
  if (asStaff && !locationCode && !equipmentCode) return <Navigate to="/dashboard" replace />

  if (created) return <ReportSuccess ticket={created} onReportAnother={reset} />

  // QR code pointing at an unknown item
  if (equipmentCode && scannedItem.data === false) {
    return (
      <EmptyState
        icon={QrCode}
        title="Unknown equipment code"
        description={`We couldn't find an item with code "${decodeURIComponent(equipmentCode)}". The QR sticker may be outdated.`}
        action={
          <Button asChild variant="outline">
            <Link to="/">Search by Equipment ID instead</Link>
          </Button>
        }
      />
    )
  }

  // QR code pointing at an unknown room
  if (locationCode && scanned.data === false) {
    return (
      <EmptyState
        icon={QrCode}
        title="Unknown room code"
        description={`We couldn't find a location with code "${decodeURIComponent(locationCode)}". The QR sticker may be outdated.`}
        action={
          <Button asChild variant="outline">
            <Link to="/">Search by Equipment ID instead</Link>
          </Button>
        }
      />
    )
  }

  const busy = submitting || aiLoading

  return (
    <>
      <PageHeader
        eyebrow={locationCode || equipmentCode ? 'Scanned QR code' : 'New report'}
        title="Report a broken facility"
        description="No account needed. Tell maintenance what's broken, get a ticket number, and earn credits when your report is confirmed."
      />

      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-0 rounded-lg border border-border bg-card shadow-xs">
          <FormSection
            className={SECTION}
            title="About you"
            description={asStaff ? 'You are signed in, so this report is filed under your staff account.' : 'Your student number links the report to you for tracking and credits.'}
          >
            {asStaff ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
                <UserRound className="size-5 shrink-0 text-muted-foreground" />
                <span>
                  Reporting as <span className="font-medium">{profile?.full_name}</span>{' '}
                  <span className="text-muted-foreground">({ROLES[profile?.role]})</span>
                </span>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Student number" htmlFor="studentNo" error={errors.studentNo} required>
                    <Input
                      id="studentNo"
                      value={student.studentNo}
                      onChange={(e) => setStudentField('studentNo', e.target.value)}
                      placeholder="2000XXXXXX"
                      autoComplete="off"
                      className="font-mono uppercase"
                      maxLength={20}
                    />
                  </Field>
                  <Field label="Name (optional)" htmlFor="reporterName" error={errors.reporterName}>
                    <Input
                      id="reporterName"
                      value={student.reporterName}
                      onChange={(e) => setStudentField('reporterName', e.target.value)}
                      placeholder="Juan Dela Cruz"
                      autoComplete="name"
                      disabled={student.isAnonymous}
                      maxLength={80}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={student.isAnonymous}
                  onClick={() => setStudentField('isAnonymous', !student.isAnonymous)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-accent/40"
                >
                  <span
                    className={cn(
                      'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                      student.isAnonymous ? 'bg-primary' : 'bg-muted-foreground/30',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform',
                        student.isAnonymous ? 'translate-x-4.5' : 'translate-x-0.5',
                      )}
                    />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <EyeOff className="size-3.5" /> Report anonymously
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">
                      Your name is hidden on the public feed. Staff still see your student number so you can receive credits.
                    </span>
                  </span>
                </button>
                <Field
                  label="Email for updates (optional)"
                  htmlFor="reporterEmail"
                  error={errors.reporterEmail}
                  hint="Leave it empty if you don't want emails. Only staff can see it; they'll email you when there's news about the repair."
                >
                  <Input
                    id="reporterEmail"
                    type="email"
                    inputMode="email"
                    value={student.reporterEmail}
                    onChange={(e) => setStudentField('reporterEmail', e.target.value)}
                    placeholder="you@gmail.com"
                    autoComplete="email"
                    maxLength={EMAIL_MAX}
                    leftIcon={<Mail />}
                  />
                </Field>
              </>
            )}
          </FormSection>

          <FormSection
            className={SECTION}
            title="What is it?"
            description="Type the Equipment ID on the sticker, the item's name, or the room. The equipment already knows where it is."
          >
            {locationCode && (
              scanned.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : scanned.error ? (
                <ErrorState compact error={scanned.error} onRetry={scanned.refetch} />
              ) : (
                <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-[13px]">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 truncate">
                    Scanned <span className="font-medium">{scanned.data?.name}</span>
                    <span className="text-muted-foreground"> · {scanned.data?.building} · {LOCATION_TYPES[scanned.data?.type]}</span>
                  </span>
                  <span className="ml-auto shrink-0 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px]">{scanned.data?.code}</span>
                </div>
              )
            )}
            <Field label="Equipment" htmlFor="equipment" error={errors.equipmentId} required>
              <EquipmentPicker
                value={equipment}
                onChange={(item) => {
                  setEquipment(item)
                  if (errors.equipmentId) setErrors((e) => ({ ...e, equipmentId: undefined }))
                }}
                locationId={locationCode ? scanned.data?.id : undefined}
                invalid={Boolean(errors.equipmentId)}
                disabled={submitting || (locationCode && scanned.isLoading) || (equipmentCode && scannedItem.isLoading)}
              />
            </Field>
          </FormSection>

          <FormSection className={SECTION} title="What's wrong?" description="A short title and any details that help the technician.">
            <Field label="Title" htmlFor="title" error={errors.title} required>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Computer won't turn on"
                maxLength={120}
              />
            </Field>
            <Field label="Details" htmlFor="description" error={errors.description} hint="What happens? Since when? Anything you already tried?">
              <Textarea
                id="description"
                rows={4}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Stuck on a black screen after the logo. Tried restarting twice."
                maxLength={2000}
              />
            </Field>

            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-primary/35 bg-primary/4 p-3.5 sm:flex-row sm:items-center">
              <div className="grid flex-1 gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="size-4 text-primary" /> Not sure how to categorize it?
                </span>
                <span className="text-[12.5px] text-muted-foreground">Claude reads your description and suggests a category and severity.</span>
              </div>
              <Button type="button" variant="outline" onClick={suggest} loading={aiLoading} disabled={submitting} leftIcon={<Sparkles />}>
                Suggest with AI
              </Button>
            </div>
            {ai && (
              <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[13px]">
                <span className="font-medium">AI summary for maintenance:</span> {ai.summary}
              </p>
            )}
          </FormSection>

          <FormSection className={SECTION} title="Category" description="Pick the closest match.">
            <Field error={errors.category}>
              <CategoryPicker value={values.category} onChange={(v) => set('category', v)} aiValue={ai?.category} />
            </Field>
          </FormSection>

          <FormSection className={SECTION} title="How serious is it?">
            <Field error={errors.severity}>
              <SeverityPicker value={values.severity} onChange={(v) => set('severity', v)} aiValue={ai?.severity} />
            </Field>
          </FormSection>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
            <h2 className="font-display text-base font-semibold">Photos</h2>
            <p className="mb-3 mt-0.5 text-[13px] text-muted-foreground">A picture helps maintenance bring the right parts.</p>
            <PhotoPicker files={photos} onChange={setPhotos} onError={(m) => toast.warning(m)} disabled={busy} />
          </div>
          <Button type="submit" size="lg" loading={submitting} disabled={aiLoading} leftIcon={<Send />} className="w-full">
            {submitting ? (photos.length ? 'Uploading photos…' : 'Submitting…') : 'Submit report'}
          </Button>
          {!asStaff && (
            <p className="rounded-md border border-border bg-card px-3 py-2 text-center text-[12px] text-muted-foreground">
              Valid reports earn <span className="font-semibold text-foreground">+{CREDITS.valid} credits</span>, plus{' '}
              <span className="font-semibold text-foreground">+{CREDITS.resolvedBonus}</span> when fixed. Keep your ticket number to
              track the repair.
            </p>
          )}
        </aside>
      </form>
    </>
  )
}
