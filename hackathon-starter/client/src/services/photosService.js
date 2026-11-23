import { friendlyError, supabase } from '@/lib/supabase'
import { MAX_PHOTO_BYTES, PHOTO_BUCKET } from '@/lib/constants'

export const photosService = {
  /** Returns an error message for an invalid file, or null when it is OK. */
  validate(file) {
    if (!file.type.startsWith('image/')) return `${file.name} is not an image`
    if (file.size > MAX_PHOTO_BYTES) return `${file.name} is larger than 5 MB`
    return null
  },

  /** Upload one photo under `ownerKey` (staff user id, or students/<number>) and return its public URL. */
  async upload(file, ownerKey) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${ownerKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    try {
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      })
      if (error) throw error
    } catch (err) {
      throw new Error(`Photo upload failed: ${friendlyError(err)}`)
    }
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
  },

  async uploadAll(files, ownerKey) {
    return Promise.all(files.map((f) => photosService.upload(f, ownerKey)))
  },
}
