/**
 * Room slots inside the 3D Academic Center, and placement of `locations` rows into them.
 *
 * Locations have no map coordinates yet, so each one gets a pseudo-random slot that stays
 * the same across reloads (seeded by the location id). A location whose `floor` names a
 * level that exists here (GF/1F → ground, 2F … 5F) goes on that level while it has free
 * slots; anything else goes into any free slot.
 *
 * Coordinates match src/lib/campus-scene.js (1 unit ≈ 1 m):
 *   x = across the frontage (west −, east +), z = depth (front 0 → back −), y = up.
 *   Upper block spans x −9…8 and z −3…−56; levels 2–5 sit on a 5 m open car park.
 */

// Same keys as LOCATION_TYPES in src/lib/constants.js (locations.type in database/schema.sql).
export const ROOM_TYPES = {
  classroom: { label: 'Classroom', color: '#3b82f6' },
  laboratory: { label: 'Laboratory', color: '#a855f7' },
  office: { label: 'Office', color: '#f59e0b' },
  library: { label: 'Library', color: '#ef4444' },
  common_area: { label: 'Common Area', color: '#10b981' },
}

export const LEVELS = [1, 2, 3, 4, 5]

export function levelLabel(level) {
  return level === 1 ? 'Ground level' : `Level ${level}`
}

const PODIUM = 5
const FLOOR_H = 3.8
const WINGS = [
  { x: -5.6, w: 6.0 }, // west wing, x −8.6 … −2.6
  { x: 4.3, w: 6.4 }, //  east wing, x 1.0 … 7.6 (corridor in between)
]
const FRONT = -3.4 // inside face of the front wall
const SLOTS_PER_WING = 6
const SLOT_LEN = 52 / SLOTS_PER_WING

/** Every place a room can go: front podium and lobby on the ground, 12 rooms per upper level. */
export const ROOM_SLOTS = [
  { level: 1, x: -6.9, z: -0.4, w: 6.0, d: 5.4, y: 0.1, h: 4.6 },
  { level: 1, x: -0.6, z: -0.4, w: 5.6, d: 5.4, y: 0.1, h: 4.6 },
  { level: 1, x: 4.7, z: -3.4, w: 4.6, d: 5.6, y: 0.55, h: 4.1 },
  { level: 1, x: -0.5, z: -18, w: 14.5, d: 10, y: 0.1, h: 4.6 },
  { level: 1, x: -0.5, z: -45, w: 14.5, d: 10, y: 0.1, h: 4.6 },
  ...[2, 3, 4, 5].flatMap((level) =>
    WINGS.flatMap(({ x, w }) =>
      Array.from({ length: SLOTS_PER_WING }, (_, i) => ({
        level,
        x,
        w,
        z: FRONT - (0.2 + SLOT_LEN * i + SLOT_LEN / 2),
        d: SLOT_LEN - 0.3,
        y: PODIUM + (level - 2) * FLOOR_H + 0.3,
        h: FLOOR_H - 0.6,
      })),
    ),
  ),
]

/** "GF", "1F", "2F", "Level 3", "3rd floor" → building level, or null if it isn't one of ours. */
function levelFromFloor(floor) {
  const text = String(floor ?? '').trim().toUpperCase()
  if (!text) return null
  if (/^(G|GF|GROUND)/.test(text)) return 1
  const n = Number(text.match(/\d+/)?.[0])
  if (n === 1) return 1
  return LEVELS.includes(n) ? n : null
}

/** Small deterministic PRNG so a location keeps its slot between reloads. */
function seeded(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/**
 * @param {Array} locations rows from `locations` (id, code, name, building, floor, type)
 * @param {Record<string, { open?: number, urgent?: number, critical?: number }>} countsById ticket counts per location id
 * @returns {{ rooms: Array, unplaced: Array }} rooms carry the location fields, the counts, slot geometry and `level`
 */
export function placeLocations(locations, countsById = {}) {
  const counts = (id) => ({ open: 0, urgent: 0, critical: 0, ...countsById[id] })
  const free = new Set(ROOM_SLOTS.map((_, i) => i))
  const rooms = []
  const unplaced = []
  // Stable order (by code) so adding one location doesn't reshuffle the others much.
  const sorted = [...locations].sort((a, b) => a.code.localeCompare(b.code))
  for (const loc of sorted) {
    const rand = seeded(loc.id)
    const wanted = levelFromFloor(loc.floor)
    const pool = [...free].filter((i) => wanted === null || ROOM_SLOTS[i].level === wanted)
    const choices = pool.length ? pool : [...free]
    if (!choices.length) {
      unplaced.push({ ...loc, ...counts(loc.id) })
      continue
    }
    const slotIndex = choices[Math.floor(rand() * choices.length)]
    free.delete(slotIndex)
    rooms.push({ ...loc, ...ROOM_SLOTS[slotIndex], ...counts(loc.id) })
  }
  return { rooms, unplaced }
}
