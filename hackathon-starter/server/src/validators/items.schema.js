import { z } from 'zod'

/**
 * Request schemas for /api/items. Keep in sync with:
 *   - database/schema.sql        (column types & CHECK constraints)
 *   - client/src/lib/schemas.js  (form validation)
 *   - docs/API_CONTRACT.md
 */
export const ITEM_STATUSES = ['todo', 'in_progress', 'done', 'archived']
export const ITEM_PRIORITIES = ['low', 'medium', 'high']
export const ITEM_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'status', 'priority']

export const itemIdParams = z.object({
  id: z.string().uuid('id must be a valid UUID'),
})

// Field rules WITHOUT defaults (shared by create + update)
const fields = {
  title: z.string({ message: 'Title is required' }).trim().min(3, 'Title must be at least 3 characters').max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(1000, 'Keep it under 1000 characters'),
  status: z.enum(ITEM_STATUSES, { message: `status must be one of: ${ITEM_STATUSES.join(', ')}` }),
  priority: z.enum(ITEM_PRIORITIES, { message: `priority must be one of: ${ITEM_PRIORITIES.join(', ')}` }),
  category: z.string({ message: 'Category is required' }).trim().min(1, 'Category is required').max(60),
}

// POST: defaults applied for optional fields
export const createItemSchema = z.object({
  ...fields,
  description: fields.description.default(''),
  status: fields.status.default('todo'),
  priority: fields.priority.default('medium'),
})

// PATCH: every field optional (no defaults → untouched fields stay as they are),
// unknown keys stripped, at least one field required
export const updateItemSchema = z
  .object(fields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' })

export const listItemsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).default(''),
  status: z.enum(ITEM_STATUSES).or(z.literal('')).optional(),
  sort: z.enum(ITEM_SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
