/**
 * Creates staff demo accounts, ~35 historical student reports (student number,
 * named or anonymous, with validity reviews → credits) and a few comments, so
 * the feed, dashboard, leaderboard and analytics look alive.
 *
 *   npm run seed:demo            (from /server, after running schema.sql + seed.sql)
 *
 * Idempotent: staff users are reused, and student reports are only generated
 * when none exist yet. Also removes the v1 demo *student account* (students no
 * longer sign in). Needs SUPABASE_URL and a secret/service-role key in server/.env.
 */
import { env } from '../src/config/env.js'
import { supabase } from '../src/config/supabase.js'

const DEMO_PASSWORD = 'CampusFix2026!'

const DEMO_USERS = [
  { email: 'admin@campusfix.demo', full_name: 'Alex Rivera', role: 'admin' },
  { email: 'maintenance@campusfix.demo', full_name: 'Mario Santos', role: 'maintenance' },
  { email: 'labassistant@campusfix.demo', full_name: 'Lea Cruz', role: 'lab_assistant' },
  { email: 'teacher@campusfix.demo', full_name: 'Prof. Diana Reyes', role: 'teacher' },
]
const LEGACY_STUDENT_EMAIL = 'student@campusfix.demo'

// [student number, name ('' = always anonymous)]
const STUDENTS = [
  ['2023-00412', 'Sam Dela Cruz'],
  ['2023-01187', 'Maria Santos'],
  ['2024-00056', 'Jessa Villanueva'],
  ['2022-03321', 'Paolo Garcia'],
  ['2024-00731', 'Bea Mendoza'],
  ['2023-02045', 'Kenji Tan'],
  ['2022-01909', ''],
  ['2024-01266', 'Lara Aquino'],
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

const STUDENT_COMMENTS = [
  'Same problem here during our 2pm class.',
  'Still happening this morning.',
  'The one beside it is also acting up.',
  'Can confirm, it has been like this since Monday.',
  'Thanks for fixing this so fast!',
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

async function listAuthUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users
}

async function ensureUser({ email, full_name, role }, existing) {
  let user = existing.find((u) => u.email === email)

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

  // The sign-up trigger always creates teachers, so set the real role here.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name, role }, { onConflict: 'id' })
  if (profileError) throw profileError
  return { ...user, role, full_name }
}

/** Students no longer have accounts; deleting the v1 demo student cascades to its tickets. */
async function removeLegacyStudent(existing) {
  const legacy = existing.find((u) => u.email === LEGACY_STUDENT_EMAIL)
  if (!legacy) return
  const { error } = await supabase.auth.admin.deleteUser(legacy.id)
  if (error) throw error
  console.log('→ Removed the v1 demo student account (students now report with a student number).')
}

const staffIdsOf = (users) => [users.maintenance.id, users.lab_assistant.id, users.teacher.id]

/**
 * Some discussion on ~40% of student reports: a classmate confirms the problem,
 * and the assigned staff member replies. Runs only when no comments exist yet.
 * Every row lists every column so a mixed batch insert never sends NULLs.
 */
async function seedComments(staff) {
  const { count, error: countError } = await supabase.from('ticket_comments').select('id', { head: true, count: 'exact' })
  if (countError) throw countError
  if (count > 0) {
    console.log(`→ ${count} comments already exist, skipping comments.`)
    return
  }

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, status, assigned_to, created_at')
    .not('student_no', 'is', null)
  if (error) throw error

  const rows = []
  for (const t of tickets) {
    if (Math.random() >= 0.4) continue
    const createdMs = new Date(t.created_at).getTime()
    const ageHours = (Date.now() - createdMs) / 3_600_000
    const [otherNo, otherName] = pick(STUDENTS)
    rows.push({
      ticket_id: t.id,
      author_id: null,
      student_no: otherNo,
      display_name: otherName,
      is_anonymous: !otherName || Math.random() < 0.3,
      body: pick(STUDENT_COMMENTS),
      created_at: hoursAgo(Math.max(0.1, ageHours * Math.random())),
    })
    const replier = t.assigned_to ?? (t.status !== 'pending' ? pick(staff) : null)
    if (replier) {
      rows.push({
        ticket_id: t.id,
        author_id: replier,
        student_no: null,
        display_name: '',
        is_anonymous: false,
        body: t.status === 'resolved' ? 'Fixed. Comment here if it happens again.' : 'Thanks for the extra details, we are on it.',
        created_at: hoursAgo(Math.max(0.05, ageHours * Math.random() * 0.5)),
      })
    }
  }

  if (rows.length) {
    const { error: insertError } = await supabase.from('ticket_comments').insert(rows)
    if (insertError) throw insertError
  }
  console.log(`→ Added ${rows.length} comments.`)
}

async function main() {
  if (!supabase || !env.supabase.usingServiceRole) {
    console.error('❌ Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in server/.env first.')
    process.exit(1)
  }

  console.log('→ Creating staff demo users…')
  const existing = await listAuthUsers()
  const users = {}
  for (const u of DEMO_USERS) users[u.role] = await ensureUser(u, existing)
  await removeLegacyStudent(existing)

  const { data: locations, error: locError } = await supabase.from('locations').select('id, code')
  if (locError) throw locError
  if (!locations.length) {
    console.error('❌ No locations found. Run database/seed.sql in the Supabase SQL editor first.')
    process.exit(1)
  }
  const locByCode = Object.fromEntries(locations.map((l) => [l.code, l.id]))

  const { count, error: countError } = await supabase
    .from('tickets')
    .select('id', { head: true, count: 'exact' })
    .not('student_no', 'is', null)
  if (countError) {
    if (/student_no/.test(countError.message ?? '')) {
      console.error('❌ The database is missing the v2 columns. Re-run database/schema.sql in the Supabase SQL editor first.')
      process.exit(1)
    }
    throw countError
  }

  if (count > 0) {
    console.log(`→ ${count} student reports already exist, skipping ticket generation.`)
  } else {
    console.log('→ Generating historical student reports…')
    const staff = staffIdsOf(users)

    for (let i = 0; i < 35; i++) {
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

      // Students earlier in the list report more often → a nicer leaderboard spread.
      const [studentNo, studentName] = STUDENTS[Math.floor(Math.pow(Math.random(), 1.6) * STUDENTS.length)]
      const anonymous = !studentName || Math.random() < 0.2
      // Most reviewed reports are valid; recent pending ones are often still unreviewed.
      const validity = status === 'pending' && Math.random() < 0.7 ? 'unreviewed' : Math.random() < 0.88 ? 'valid' : 'invalid'
      const reviewer = validity === 'unreviewed' ? null : pick(staff)

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          location_id: locByCode[code],
          student_no: studentNo,
          reporter_name: studentName,
          is_anonymous: anonymous,
          assigned_to: assignee,
          category,
          severity,
          status,
          title,
          description,
          asset_label: asset,
          validity,
          validated_by: reviewer,
          validated_at: reviewer ? startedAt : null,
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

  await seedComments(staffIdsOf(users))

  console.log(`\n✅ Demo data ready. Staff sign in with any of these (password: ${DEMO_PASSWORD}):`)
  for (const u of DEMO_USERS) console.log(`   ${u.role.padEnd(13)} ${u.email}`)
  console.log('   Students do not sign in: they report from the home page with a student number, e.g. 2023-00412.')
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err.message ?? err)
  process.exit(1)
})
