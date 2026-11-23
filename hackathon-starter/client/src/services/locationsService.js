import { friendlyError, query, supabase } from '@/lib/supabase'

export const locationsService = {
  async list() {
    return query(supabase.from('locations').select('*').order('building').order('name'), 'Could not load locations')
  },

  /** Resolve a QR code value (e.g. "CL-LAB-2"). Returns null if not found. */
  async getByCode(code) {
    return query(
      supabase.from('locations').select('*').eq('code', code.toUpperCase()).maybeSingle(),
      'Could not look up this location',
    )
  },

  /** @param {{ code: string, name: string, building?: string, floor?: string, type: string }} input */
  async create(input) {
    return query(
      supabase
        .from('locations')
        .insert({
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          building: input.building?.trim() ?? '',
          floor: input.floor?.trim() ?? '',
          type: input.type,
        })
        .select('*')
        .single(),
      'Could not add the location',
    )
  },

  /** @param {string} id  @param {{ code: string, name: string, building?: string, floor?: string, type: string }} input */
  async update(id, input) {
    return query(
      supabase
        .from('locations')
        .update({
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          building: input.building?.trim() ?? '',
          floor: input.floor?.trim() ?? '',
          type: input.type,
        })
        .eq('id', id)
        .select('*')
        .single(),
      'Could not save the location',
    )
  },

  /** Tickets block deletion (FK on delete restrict); equipment is deleted with the room (cascade). */
  async usage(id) {
    const count = async (table, fallback) => {
      const res = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('location_id', id)
      if (res.error) throw new Error(friendlyError(res.error, fallback))
      return res.count ?? 0
    }
    try {
      const [tickets, equipment] = await Promise.all([
        count('tickets', 'Could not check this location’s tickets'),
        count('equipment', 'Could not check this location’s equipment'),
      ])
      return { tickets, equipment }
    } catch (err) {
      throw err instanceof Error ? err : new Error(friendlyError(err, 'Could not check this location'))
    }
  },

  /** Open high/critical tickets per location: { [location_id]: { urgent, critical } }. */
  async urgentByLocation() {
    const rows = await query(
      supabase.from('tickets').select('location_id, severity').neq('status', 'resolved').in('severity', ['high', 'critical']),
      'Could not load urgent issues',
    )
    const byId = {}
    for (const { location_id, severity } of rows ?? []) {
      const entry = (byId[location_id] ??= { urgent: 0, critical: 0 })
      entry.urgent += 1
      if (severity === 'critical') entry.critical += 1
    }
    return byId
  },

  async remove(id) {
    return query(supabase.from('locations').delete().eq('id', id), 'Could not delete the location')
  },
}
