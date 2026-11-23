import { query, supabase } from '@/lib/supabase'

const SELECT = `
  id, short_code, name, description, location_id,
  location:locations!equipment_location_id_fkey ( id, code, name, building, floor, type )
`

/** Strip characters that would break a PostgREST `or()` filter. */
const clean = (term = '') => term.replace(/[%,()*\\]/g, ' ').trim()

/** Equipment items with sticker IDs (CL2-PC15). Each one carries its location. */
export const equipmentService = {
  /** All equipment, optionally for one room, ordered by short code. */
  list: ({ locationId } = {}) => {
    let q = supabase.from('equipment').select(SELECT).order('short_code')
    if (locationId) q = q.eq('location_id', locationId)
    return query(q, 'Could not load equipment')
  },

  /**
   * Search by Equipment ID, equipment name, or room (name / code / building).
   * With an empty term and a `locationId`, lists that room's equipment.
   * @returns {Promise<Array>} up to `limit` items, best matches (ID prefix) first
   */
  async search(term, { locationId, limit = 15 } = {}) {
    const s = clean(term)

    if (!s) {
      if (!locationId) return []
      return query(
        supabase.from('equipment').select(SELECT).eq('location_id', locationId).order('short_code').limit(50),
        'Could not load equipment',
      )
    }

    let direct = supabase
      .from('equipment')
      .select(SELECT)
      .or(`short_code.ilike.%${s}%,name.ilike.%${s}%`)
      .order('short_code')
      .limit(limit)
    if (locationId) direct = direct.eq('location_id', locationId)

    const byRoom = locationId
      ? Promise.resolve([])
      : query(
          supabase.from('locations').select('id').or(`name.ilike.%${s}%,code.ilike.%${s}%,building.ilike.%${s}%`).limit(10),
          'Could not search locations',
        ).then((locs) =>
          locs.length
            ? query(
                supabase
                  .from('equipment')
                  .select(SELECT)
                  .in('location_id', locs.map((l) => l.id))
                  .order('short_code')
                  .limit(limit),
                'Could not search equipment',
              )
            : [],
        )

    const [a, b] = await Promise.all([query(direct, 'Could not search equipment'), byRoom])
    const seen = new Set()
    const upper = s.toUpperCase()
    return [...a, ...b]
      .filter((e) => (seen.has(e.id) ? false : seen.add(e.id)))
      .sort((x, y) => Number(!x.short_code.startsWith(upper)) - Number(!y.short_code.startsWith(upper)))
      .slice(0, limit)
  },

  getByCode: (code) =>
    query(
      supabase.from('equipment').select(SELECT).eq('short_code', code.trim().toUpperCase()).maybeSingle(),
      'Could not look up this equipment',
    ),

  /** Resolve a QR sticker value (e.g. "CL1-PC-15"), with its room. Returns null if not found. */
  getByShortCode: (code) => equipmentService.getByCode(code),

  listByLocation: (locationId) =>
    query(
      supabase.from('equipment').select(SELECT).eq('location_id', locationId).order('short_code'),
      'Could not load equipment',
    ),

  /** { [location_id]: count } for the Campus Map cards. */
  async countsByLocation() {
    const rows = await query(supabase.from('equipment').select('location_id'), 'Could not load equipment counts')
    const counts = {}
    for (const r of rows) counts[r.location_id] = (counts[r.location_id] ?? 0) + 1
    return counts
  },

  /** @param {{ shortCode: string, name: string, description?: string, locationId: string }} input */
  create: (input) =>
    query(
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
      'Could not add the equipment',
    ).catch(duplicateMessage),

  update: (id, input) =>
    query(
      supabase
        .from('equipment')
        .update({
          short_code: input.shortCode.trim().toUpperCase(),
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
        })
        .eq('id', id)
        .select(SELECT)
        .single(),
      'Could not save the equipment',
    ).catch(duplicateMessage),

  remove: (id) => query(supabase.from('equipment').delete().eq('id', id), 'Could not delete the equipment'),
}

function duplicateMessage(err) {
  if (/already exists/i.test(err.message)) throw new Error('That equipment ID already exists. Use a different one.')
  throw err
}
