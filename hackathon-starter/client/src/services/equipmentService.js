import { query, supabase } from '@/lib/supabase'

/**
 * Equipment — individual items inside a room, each with its own QR sticker.
 * Direct Supabase access (see CLAUDE.md: no Express for CRUD).
 */

const SELECT = `
  id, short_code, name, description, location_id, created_at,
  location:locations!equipment_location_id_fkey ( id, code, name, building, floor, type )
`

export const equipmentService = {
  /** All equipment, optionally for one room, ordered by short code. */
  async list({ locationId } = {}) {
    let q = supabase.from('equipment').select(SELECT).order('short_code')
    if (locationId) q = q.eq('location_id', locationId)
    return query(q, 'Could not load equipment')
  },

  /** Resolve a QR code value (e.g. "CL1-PC-15"), with its room. Returns null if not found. */
  async getByShortCode(shortCode) {
    return query(
      supabase.from('equipment').select(SELECT).eq('short_code', shortCode.trim().toUpperCase()).maybeSingle(),
      'Could not look up this item',
    )
  },

  /** @param {{ shortCode: string, name: string, description?: string, locationId: string }} input */
  async create(input) {
    return query(
      supabase
        .from('equipment')
        .insert({
          short_code: input.shortCode.trim().toUpperCase(),
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
          location_id: input.locationId,
        })
        .select(SELECT)
        .single(),
      'Could not add the item',
    )
  },

  async remove(id) {
    return query(supabase.from('equipment').delete().eq('id', id), 'Could not delete the item')
  },
}
