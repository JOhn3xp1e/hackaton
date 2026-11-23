import { z } from 'zod'

// Keep in sync with the CHECK constraints on public.tickets in database/schema.sql
export const CATEGORIES = [
  'computer_equipment',
  'projector_av',
  'furniture',
  'electrical',
  'network_internet',
  'plumbing',
  'air_conditioning',
  'other',
]
export const SEVERITIES = ['low', 'medium', 'high', 'critical']

export const triageRequestSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().max(2000).default(''),
  assetLabel: z.string().trim().max(80).default(''),
  locationName: z.string().trim().max(120).default(''),
})

export const triageResultSchema = z.object({
  category: z.enum(CATEGORIES),
  severity: z.enum(SEVERITIES),
  summary: z.string().trim().min(1),
})
