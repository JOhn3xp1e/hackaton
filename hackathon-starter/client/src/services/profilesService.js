import { query, supabase } from '@/lib/supabase'
import { STAFF_ROLES } from '@/lib/constants'

export const profilesService = {
  get: (id) => query(supabase.from('profiles').select('*').eq('id', id).maybeSingle(), 'Could not load your profile'),

  updateName: (id, fullName) =>
    query(
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', id).select('*').single(),
      'Could not save your profile',
    ),

  /** Staff members who can be assigned tickets. */
  listStaff: () =>
    query(
      supabase.from('profiles').select('id, full_name, role').in('role', STAFF_ROLES).order('full_name'),
      'Could not load staff',
    ),
}
