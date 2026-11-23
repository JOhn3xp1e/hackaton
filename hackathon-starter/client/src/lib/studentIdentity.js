import { useCallback, useState } from 'react'

/**
 * Students don't have accounts. Their student number, optional name and
 * anonymous preference are remembered on this device so forms are pre-filled
 * and the "My reports" filter works. Storage may be unavailable (private mode),
 * so every access is guarded and the app still works without it.
 */
const KEY = 'cf-student-identity'
const EMPTY = { studentNo: '', name: '', anonymous: false, email: '' }

export function readStudentIdentity() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

export function saveStudentIdentity(identity) {
  const next = {
    studentNo: (identity.studentNo ?? '').trim().toUpperCase(),
    name: (identity.name ?? '').trim(),
    anonymous: Boolean(identity.anonymous),
    email: (identity.email ?? '').trim().toLowerCase(),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: identity just isn't remembered */
  }
  return next
}

/** React hook: [identity, save]. */
export function useStudentIdentity() {
  const [identity, setIdentity] = useState(readStudentIdentity)
  const save = useCallback((next) => setIdentity(saveStudentIdentity(next)), [])
  return [identity, save]
}

/** "2023-00412" → "2023-•••12" (shown publicly instead of the full number). */
export function maskStudentNo(no = '') {
  if (!no) return ''
  if (no.length <= 6) return `${no.slice(0, 2)}•••${no.slice(-1)}`
  return `${no.slice(0, 5)}•••${no.slice(-2)}`
}

/**
 * Public display name for a ticket / comment author.
 *   staff profile → full name; named student → name; anonymous → "Anonymous student"
 */
export function reporterLabel({ reporter, reporter_name, is_anonymous, student_no } = {}) {
  if (reporter?.full_name) return reporter.full_name
  if (!is_anonymous && reporter_name) return reporter_name
  if (student_no) return 'Anonymous student'
  return 'Unknown'
}
