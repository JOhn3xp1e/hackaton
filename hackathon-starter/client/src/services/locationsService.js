import { query, supabase } from '@/lib/supabase'

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
}
