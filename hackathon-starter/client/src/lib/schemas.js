import { z } from 'zod'

/**
 * Form validation schemas (Zod). Mirror the server-side schemas in
 * server/src/validators so the UI shows the same errors the API would return.
 */

export const ITEM_STATUSES = ['todo', 'in_progress', 'done', 'archived']
export const ITEM_PRIORITIES = ['low', 'medium', 'high']

export const itemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(1000, 'Keep it under 1000 characters').optional().or(z.literal('')),
  status: z.enum(ITEM_STATUSES, { message: 'Choose a status' }),
  priority: z.enum(ITEM_PRIORITIES, { message: 'Choose a priority' }),
  category: z.string().trim().min(1, 'Category is required').max(60),
})

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email'),
  role: z.string().min(1, 'Choose a role'),
  bio: z.string().max(280, 'Max 280 characters').optional().or(z.literal('')),
  notifications: z.boolean(),
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
