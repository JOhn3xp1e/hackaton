import { z } from 'zod'

/**
 * Shared form validation schemas (Zod). Page-specific schemas live next to
 * their page (e.g. pages/report/ReportPage.jsx).
 */

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(120, 'Keep it under 120 characters'),
})

/** Convert a Zod error into { fieldName: 'first message' } */
export function zodErrorsToObject(error) {
  const out = {}
  for (const issue of error?.issues ?? []) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
