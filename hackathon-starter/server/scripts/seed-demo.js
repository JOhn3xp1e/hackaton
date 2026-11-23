/**
 * Creates demo accounts and ~40 historical tickets so the dashboard and
 * analytics look alive for the presentation.
 *
 *   npm run seed:demo            (from /server, after running schema.sql + seed.sql)
 *
 * Idempotent: existing demo users are reused, and tickets are only generated
 * when the demo reporters have none yet. Needs SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in server/.env.
 */
import { env } from '../src/config/env.js'
import { supabase } from '../src/config/supabase.js'

const DEMO_PASSWORD = 'CampusFix2026!'

const DEMO_USERS = [
  { email: 'admin@campusfix.demo', full_name: 'Alex Rivera', role: 'admin' },
  { email: 'maintenance@campusfix.demo', full_name: 'Mario Santos', role: 'maintenance' },
  { email: 'labassistant@campusfix.demo', full_name: 'Lea Cruz', role: 'lab_assistant' },
  { email: 'teacher@campusfix.demo', full_name: 'Prof. Diana Reyes', role: 'teacher' },
  { email: 'student@campusfix.demo', full_name: 'Sam Dela Cruz', role: 'student' },
]

// [category, severity, title, asset, description, preferred location codes]
const TEMPLATES = [
  ['computer_equipment', 'medium', 'Computer will not boot', 'Computer 15', 'Stuck on a black screen after the BIOS logo.', ['CL-LAB-1', 'CL-LAB-2']],
  ['computer_equipment', 'low', 'Keyboard missing keys', 'Computer 7', 'The E and R keys are missing.', ['CL-LAB-1', 'CL-LAB-2']],
  ['computer_equipment', 'medium', 'Monitor flickering', 'Computer 22', 'Screen flickers every few seconds, hard to read.', ['CL-LAB-2', 'LIB-MAIN']],
  ['computer_equipment', 'high', 'Printer jammed and showing error', 'Shared printer', 'Error E-04, nobody can print hand-outs.', ['REG-OFC', 'LIB-MAIN']],
  ['projector_av', 'high', 'Projector not turning on', 'Ceiling projector', 'No power light at all. Class presentation today.', ['RM-101', 'RM-204', 'AVR-1', 'RM-305']],
  ['projector_av', 'medium', 'No sound from speakers', 'Wall speakers', 'Laptop audio works but room speakers are silent.', ['AVR-1', 'RM-204']],
  ['projector_av', 'medium', 'HDMI cable damaged', 'HDMI cable', 'Picture cuts out when the cable is touched.', ['RM-101', 'RM-305']],
  ['furniture', 'low', 'Broken chair', 'Chair, row 3', 'Backrest is loose and wobbles.', ['RM-101', 'RM-204', 'RM-305', 'CANTEEN']],
  ['furniture', 'medium', 'Desk leg broken', 'Desk near window', 'Desk tilts and items slide off.', ['RM-204', 'CHEM-LAB']],
  ['furniture', 'low', 'Whiteboard stained', 'Front whiteboard', 'Marker stains will not erase.', ['RM-305', 'RM-101']],
  ['electrical', 'critical', 'Outlet sparking', 'Outlet beside teacher table', 'Saw sparks when plugging in a charger. Burning smell.', ['PHYS-LAB', 'RM-204']],
  ['electrical', 'high', 'Lights out in half the room', 'Ceiling lights', 'Back half of the room is dark.', ['LIB-MAIN', 'RM-101', 'GYM']],
  ['electrical', 'medium', 'Light switch not working', 'Main switch', 'Need to flip the breaker to turn lights on.', ['CHEM-LAB', 'CANTEEN']],
  ['network_internet', 'high', 'No internet in the lab', 'Lab network', 'All PCs show "No internet access".', ['CL-LAB-1', 'CL-LAB-2']],
  ['network_internet', 'medium', 'Wi-Fi very slow', 'Campus Wi-Fi', 'Pages take a minute to load during class.', ['LIB-MAIN', 'CANTEEN', 'RM-204']],
  ['network_internet', 'low', 'LAN port loose', 'Port 12', 'Cable falls out of the wall port.', ['CL-LAB-2', 'REG-OFC']],
  ['plumbing', 'high', 'Sink leaking', 'Lab sink 2', 'Water pooling under the sink, floor is slippery.', ['CHEM-LAB', 'CANTEEN']],
  ['plumbing', 'medium', 'Drinking fountain not working', 'Drinking fountain', 'No water comes out.', ['GYM', 'CANTEEN']],
  ['air_conditioning', 'high', 'Aircon not cooling', 'Aircon unit 1', 'Room is very hot, unit only blows warm air.', ['CL-LAB-1', 'CL-LAB-2', 'AVR-1', 'LIB-MAIN']],
  ['air_conditioning', 'medium', 'Aircon dripping water', 'Aircon unit 2', 'Water drips onto the desks below.', ['RM-204', 'REG-OFC']],
  ['other', 'low', 'Door lock jammed', 'Main door', 'Key turns but the lock sticks.', ['RM-305', 'PHYS-LAB']],
]

const NOTES = {
  in_progress: ['Checked on site, parts ordered.', 'Technician assigned, working on it.', 'Diagnosed the problem, fixing today.'],
  resolved: ['Replaced the faulty part. Working now.', 'Fixed and tested with the class.', 'Repaired and cleaned up the area.'],
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

async function ensureUser({ email, full_name, role }) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError
  let user = list.users.find((u) => u.email === email)

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name },
    })
    if (error) throw error
    user = data.user
  }

  // The sign-up trigger only allows student/teacher, so set the real role here.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name, role }, { onConflict: 'id' })
  if (profileError) throw profileError
  return { ...user, role, full_name }
}

async function main() {
  if (!supabase || !env.supabase.usingServiceRole) {
    console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env first.')
    process.exit(1)
  }

  console.log('→ Creating demo users…')
  const users = {}
  for (const u of DEMO_USERS) users[u.role] = await ensureUser(u)

  const { data: locations, error: locError } = await supabase.from('locations').select('id, code')
  if (locError) throw locError
  if (!locations.length) {
    console.error('❌ No locations found. Run database/seed.sql in the Supabase SQL editor first.')
    process.exit(1)
  }
  const locByCode = Object.fromEntries(locations.map((l) => [l.code, l.id]))

  const reporterIds = [users.student.id, users.teacher.id, users.lab_assistant.id]
  const { count, error: countError } = await supabase
    .from('tickets')
    .select('id', { head: true, count: 'exact' })
    .in('reporter_id', reporterIds)
  if (countError) throw countError

  if (count > 0) {
    console.log(`→ ${count} demo tickets already exist, skipping ticket generation.`)
  } else {
    console.log('→ Generating historical tickets…')
    const staff = [users.maintenance.id, users.lab_assistant.id]

    for (let i = 0; i < 40; i++) {
      const [category, severity, title, asset, description, codes] = pick(TEMPLATES)
      const code = codes.find((c) => locByCode[c] && Math.random() < 0.6) ?? codes.find((c) => locByCode[c])
      if (!code) continue

      // Spread over the last 30 days, weighted towards recent days.
      const ageHours = Math.round(Math.pow(Math.random(), 1.4) * 30 * 24) + 1
      const status = ageHours < 30 ? pick(['pending', 'pending', 'in_progress']) : pick(['resolved', 'resolved', 'resolved', 'in_progress', 'pending'])
      const createdAt = hoursAgo(ageHours)
      const startedAge = Math.max(0.5, ageHours - (2 + Math.random() * 6))
      const resolvedAge = Math.max(0.2, startedAge - (4 + Math.random() * 60))
      const startedAt = hoursAgo(startedAge)
      const resolvedAt = hoursAgo(resolvedAge)
      const assignee = status === 'pending' ? null : pick(staff)

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          location_id: locByCode[code],
          reporter_id: pick(reporterIds),
          assigned_to: assignee,
          category,
          severity,
          status,
          title,
          description,
          asset_label: asset,
          resolved_at: status === 'resolved' ? resolvedAt : null,
          created_at: createdAt,
          updated_at: status === 'resolved' ? resolvedAt : status === 'in_progress' ? startedAt : createdAt,
        })
        .select('id')
        .single()
      if (error) throw error

      const timeline = []
      if (status !== 'pending') {
        timeline.push({ ticket_id: ticket.id, author_id: assignee, from_status: 'pending', to_status: 'in_progress', note: pick(NOTES.in_progress), created_at: startedAt })
      }
      if (status === 'resolved') {
        timeline.push({ ticket_id: ticket.id, author_id: assignee, from_status: 'in_progress', to_status: 'resolved', note: pick(NOTES.resolved), created_at: resolvedAt })
      }
      if (timeline.length) {
        const { error: tlError } = await supabase.from('ticket_updates').insert(timeline)
        if (tlError) throw tlError
      }
    }
  }

  console.log('\n✅ Demo data ready. Sign in with any of these (password: ' + DEMO_PASSWORD + '):')
  for (const u of DEMO_USERS) console.log(`   ${u.role.padEnd(13)} ${u.email}`)
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err.message ?? err)
  process.exit(1)
})
