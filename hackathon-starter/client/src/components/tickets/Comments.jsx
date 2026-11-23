import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { EyeOff, MessageSquare, Send } from 'lucide-react'
import { z } from 'zod'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/toast'
import { ROLES, STUDENT_NO_PATTERN } from '@/lib/constants'
import { zodErrorsToObject } from '@/lib/schemas'
import { useStudentIdentity } from '@/lib/studentIdentity'
import { cn, timeAgo } from '@/lib/utils'
import { commentsService } from '@/services/commentsService'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/feedback/ErrorState'

const bodySchema = z.string().trim().min(2, 'Write a short comment').max(1000, 'Keep it under 1000 characters')
const studentSchema = z.object({
  studentNo: z.string().trim().regex(STUDENT_NO_PATTERN, 'Enter your student number'),
  displayName: z.string().trim().max(80),
  isAnonymous: z.boolean(),
})

function authorOf(c) {
  if (c.author) return { name: c.author.full_name || 'Staff', staff: true, role: c.author.role }
  if (c.is_anonymous || !c.display_name) return { name: 'Anonymous student', staff: false }
  return { name: c.display_name, staff: false }
}

/**
 * Public, live comment thread on a report. Signed-in staff comment as
 * themselves; students comment with their student number (name optional).
 */
export function Comments({ ticket }) {
  const toast = useToast()
  const { user, profile, isStaff } = useAuth()
  const [identity, saveIdentity] = useStudentIdentity()
  const asStaff = Boolean(user && isStaff)

  const [body, setBody] = useState('')
  const [student, setStudent] = useState({ studentNo: identity.studentNo, displayName: identity.name, isAnonymous: identity.anonymous })
  const [errors, setErrors] = useState({})
  const [posting, setPosting] = useState(false)

  const { data, isLoading, error, refetch, setData } = useAsync(() => commentsService.list(ticket.id), [ticket.id], {
    initialData: [],
  })

  // Live: reload when anyone comments (refetch brings the author's profile along).
  useEffect(() => commentsService.subscribe(ticket.id, () => refetch()), [ticket.id, refetch])

  const submit = async (e) => {
    e.preventDefault()
    const b = bodySchema.safeParse(body)
    const who = asStaff ? { success: true, data: {} } : studentSchema.safeParse(student)
    if (!b.success || !who.success) {
      setErrors({
        ...(b.success ? {} : { body: b.error.issues[0].message }),
        ...(who.success ? {} : zodErrorsToObject(who.error)),
      })
      return
    }
    setErrors({})
    setPosting(true)
    try {
      const created = await commentsService.create({
        ticketId: ticket.id,
        body: b.data,
        ...(asStaff
          ? { authorId: user.id }
          : { studentNo: who.data.studentNo, displayName: who.data.displayName, isAnonymous: who.data.isAnonymous }),
      })
      if (!asStaff) saveIdentity({ studentNo: who.data.studentNo, name: who.data.displayName, anonymous: who.data.isAnonymous })
      setData((list) => (list?.some((c) => c.id === created.id) ? list : [...(list ?? []), created]))
      setBody('')
    } catch (err) {
      toast.error('Comment not posted', { description: err.message })
    } finally {
      setPosting(false)
    }
  }

  const comments = data ?? []

  return (
    <div className="grid gap-5">
      {isLoading && !comments.length ? (
        <div className="grid place-items-center py-6 text-muted-foreground">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorState compact error={error} onRetry={refetch} />
      ) : comments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" /> No comments yet. Seen the same problem? Let others know.
        </p>
      ) : (
        <ul className="grid gap-4">
          {comments.map((c) => {
            const a = authorOf(c)
            const isReporter = !c.author && c.student_no && c.student_no === ticket.student_no
            return (
              <motion.li key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar name={a.name} size="sm" />
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <span className="font-medium">{a.name}</span>
                    {a.staff && <Badge variant="primary">{ROLES[a.role] ?? 'Staff'}</Badge>}
                    {isReporter && <Badge variant="outline">Reporter</Badge>}
                    <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  </div>
                  <p
                    className={cn(
                      'whitespace-pre-line rounded-lg px-3 py-2 text-sm',
                      a.staff ? 'border border-primary/20 bg-primary/5' : 'bg-muted/60',
                    )}
                  >
                    {c.body}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="grid gap-3 border-t border-border pt-4">
        {asStaff ? (
          <p className="text-[12.5px] text-muted-foreground">
            Commenting as <span className="font-medium text-foreground">{profile?.full_name}</span> ({ROLES[profile?.role]})
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto] sm:items-start">
            <Field error={errors.studentNo}>
              <Input
                aria-label="Student number"
                value={student.studentNo}
                onChange={(e) => setStudent((s) => ({ ...s, studentNo: e.target.value }))}
                placeholder="2000XXXXXX"
                className="font-mono uppercase"
                maxLength={20}
              />
            </Field>
            <Input
              aria-label="Name (optional)"
              value={student.displayName}
              onChange={(e) => setStudent((s) => ({ ...s, displayName: e.target.value }))}
              placeholder="Name (optional)"
              disabled={student.isAnonymous}
              maxLength={80}
            />
            <Button
              type="button"
              variant={student.isAnonymous ? 'secondary' : 'outline'}
              aria-pressed={student.isAnonymous}
              onClick={() => setStudent((s) => ({ ...s, isAnonymous: !s.isAnonymous }))}
              leftIcon={<EyeOff />}
            >
              {student.isAnonymous ? 'Anonymous' : 'Show name'}
            </Button>
          </div>
        )}
        <Field error={errors.body}>
          <Textarea
            aria-label="Comment"
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={asStaff ? 'Reply to the reporter…' : 'Same issue? Extra details? Write a comment…'}
            maxLength={1000}
          />
        </Field>
        <Button type="submit" loading={posting} leftIcon={<Send />} className="w-fit justify-self-end">
          Post comment
        </Button>
      </form>
    </div>
  )
}
