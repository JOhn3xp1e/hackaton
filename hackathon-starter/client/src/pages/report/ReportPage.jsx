import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { MapPin, QrCode, Send, Sparkles } from 'lucide-react'
import { z } from 'zod'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { CATEGORIES, CATEGORY_KEYS, LOCATION_TYPES, SEVERITIES, SEVERITY_KEYS } from '@/lib/constants'
import { zodErrorsToObject } from '@/lib/schemas'
import { locationsService } from '@/services/locationsService'
import { photosService } from '@/services/photosService'
import { ticketsService } from '@/services/ticketsService'
import { triageService } from '@/services/triageService'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormSection } from '@/components/shared/FormContainer'
import { CategoryPicker } from '@/components/report/CategoryPicker'
import { SeverityPicker } from '@/components/report/SeverityPicker'
import { PhotoPicker } from '@/components/report/PhotoPicker'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportSuccess } from './ReportSuccess'

const schema = z.object({
  locationId: z.string().uuid('Choose where the problem is'),
  category: z.enum(CATEGORY_KEYS, { message: 'Choose a category' }),
  severity: z.enum(SEVERITY_KEYS, { message: 'Choose how serious it is' }),
  title: z.string().trim().min(3, 'Describe the problem in a few words').max(120, 'Keep it under 120 characters'),
  assetLabel: z.string().trim().max(80, 'Keep it under 80 characters'),
  description: z.string().trim().max(2000, 'Keep it under 2000 characters'),
})

const SECTION = 'border-b border-border px-5 py-5 last:border-b-0 sm:px-6'

const EMPTY = { locationId: '', category: '', severity: 'medium', title: '', assetLabel: '', description: '' }

export default function ReportPage() {
  const { locationCode } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [photos, setPhotos] = useState([])
  const [ai, setAi] = useState(null) // { category, severity, summary }
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  // QR flow: resolve the scanned location. Otherwise load all locations for the picker.
  const scanned = useAsync(
    async () => {
      if (!locationCode) return null
      const loc = await locationsService.getByCode(decodeURIComponent(locationCode))
      if (loc) setValues((v) => ({ ...v, locationId: loc.id }))
      return loc ?? false
    },
    [locationCode],
  )
  const all = useAsync(() => (locationCode ? Promise.resolve([]) : locationsService.list()), [locationCode], { initialData: [] })

  const locationOptions = useMemo(() => {
    const groups = {}
    for (const l of all.data ?? []) (groups[l.building || 'Other'] ??= []).push(l)
    return Object.entries(groups).map(([building, list]) => ({ building, list }))
  }, [all.data])

  const location = locationCode ? scanned.data : (all.data ?? []).find((l) => l.id === values.locationId)

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const reset = () => {
    setValues({ ...EMPTY, locationId: locationCode && scanned.data ? scanned.data.id : '' })
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
        assetLabel: values.assetLabel.trim(),
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
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(zodErrorsToObject(parsed.error))
      toast.error('Please complete the form', { description: 'Some required details are missing.' })
      return
    }
    setSubmitting(true)
    try {
      const photoUrls = photos.length ? await photosService.uploadAll(photos, user.id) : []
      const ticket = await ticketsService.create({
        ...parsed.data,
        reporterId: user.id,
        photoUrls,
        ai,
      })
      setCreated({ ...ticket, title: parsed.data.title, locationName: location?.name })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error('Report not submitted', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (created) return <ReportSuccess ticket={created} onReportAnother={reset} />

  // QR code pointing at an unknown room
  if (locationCode && scanned.data === false) {
    return (
      <EmptyState
        icon={QrCode}
        title="Unknown room code"
        description={`We couldn't find a location with code "${decodeURIComponent(locationCode)}". The QR sticker may be outdated.`}
        action={
          <Button asChild variant="outline">
            <Link to="/report">Pick the location manually</Link>
          </Button>
        }
      />
    )
  }

  const busy = submitting || aiLoading

  return (
    <>
      <PageHeader
        eyebrow={locationCode ? 'Scanned QR code' : 'New report'}
        title="Report an issue"
        description="Tell maintenance what's broken. You'll get a ticket number to track the repair."
      />

      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-0 rounded-lg border border-border bg-card shadow-xs">
          <FormSection className={SECTION} title="Where is it?" description={locationCode ? 'Location from the QR code you scanned.' : 'Pick the room or area.'}>
            {locationCode ? (
              scanned.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : scanned.error ? (
                <ErrorState compact error={scanned.error} onRetry={scanned.refetch} />
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                    <MapPin className="size-5" />
                  </span>
                  <span className="grid min-w-0">
                    <span className="truncate font-semibold">{location?.name}</span>
                    <span className="truncate text-[13px] text-muted-foreground">
                      {location?.building} · {location?.floor} · {LOCATION_TYPES[location?.type]}
                    </span>
                  </span>
                  <span className="ml-auto rounded border border-border bg-card px-2 py-0.5 font-mono text-[11px]">{location?.code}</span>
                </div>
              )
            ) : (
              <Field label="Location" htmlFor="locationId" error={errors.locationId} required>
                {all.error ? (
                  <ErrorState compact error={all.error} onRetry={all.refetch} />
                ) : (
                  <Select
                    id="locationId"
                    value={values.locationId}
                    onChange={(e) => set('locationId', e.target.value)}
                    disabled={all.isLoading}
                  >
                    <option value="">{all.isLoading ? 'Loading locations…' : 'Choose a room or area…'}</option>
                    {locationOptions.map((g) => (
                      <optgroup key={g.building} label={g.building}>
                        {g.list.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.code})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <Field label="Which item?" htmlFor="assetLabel" error={errors.assetLabel} hint="e.g. Computer 15, Ceiling projector, Chair in row 3">
              <Input id="assetLabel" value={values.assetLabel} onChange={(e) => set('assetLabel', e.target.value)} placeholder="Computer 15" />
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
          <p className="text-center text-[12px] text-muted-foreground">You can follow the repair under “My reports”.</p>
        </aside>
      </form>
    </>
  )
}
