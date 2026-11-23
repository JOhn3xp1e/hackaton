# CampusFix

**Campus facility & equipment reporting.** Students scan a QR code in any classroom or lab and report a broken computer, projector, chair, light or Wi-Fi problem with photos. They don't need an account, only a student number. Every report appears on a public feed where anyone can comment. Staff review reports, and valid ones earn students credits on a leaderboard. Staff get a live dashboard, Claude-powered triage and analytics on the most-reported problems.

| Who | Account | What they do in CampusFix |
| --- | --- | --- |
| Students | **None.** They enter a student number, plus their name or "anonymous". | Scan the room QR → report with photo → get a ticket number → follow it on the feed → comment → earn credits |
| Teachers | Email sign-up (role `teacher`, treated as staff) | Staff dashboard: review reports as valid or invalid, update status, assign, comment, analytics |
| Lab assistants & maintenance | Created by an admin | Same as teachers |
| Administrators | Created by an admin | Everything above, plus managing locations and printing QR sticker sheets |

**Credits:** a report staff mark **Valid** earns **+10**, and **+5 more** once it's **Resolved**. An **Invalid** report earns 0. See `/leaderboard`.

| Layer | Stack |
| --- | --- |
| Frontend | React 19 · Vite 7 · JavaScript · Tailwind CSS 4 · shadcn/ui conventions · Motion · Lucide · React Router 7 · Zod · `qrcode` |
| Data | Supabase (PostgreSQL, Auth, Storage, Realtime) called directly from the browser |
| Server | Express 5 — only for secrets: `POST /api/triage` (Claude via `@anthropic-ai/sdk`) and health checks |

---

## Setup (about 10 minutes)

```bash
# 1. Install dependencies (root + client + server)
npm run setup

# 2. Env files
cp client/.env.example client/.env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
cp server/.env.example server/.env     # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
```

3. In the Supabase **SQL Editor**, run `database/schema.sql`, then `database/seed.sql` (12 campus locations).
4. Optional but recommended for the demo: under **Authentication → Providers → Email**, turn off "Confirm email" so new sign-ups can log in immediately.
5. Create the staff demo accounts and 30 days of student reports, reviews and comments:

   ```bash
   npm run seed:demo --prefix server
   ```

   This prints the staff logins (`admin@`, `maintenance@`, `labassistant@`, `teacher@campusfix.demo`) and the shared demo password. Students never sign in.

> **Upgrading from v1?** Re-run `database/schema.sql` (safe to re-run; it adds the student, review and comment columns), then `npm run seed:demo --prefix server`.

6. `npm run dev` → <http://localhost:5173>

| Command | What it does |
| --- | --- |
| `npm run dev` | Client and server together |
| `npm run build` | Production build of the client |
| `npm run test:api` | Server tests (health, auth and validation; no Claude calls) |
| `npm run seed:demo --prefix server` | Demo users and historical tickets (idempotent) |

---

## Demo script (golden path)

1. **Admin** → *Locations & QR* → print or download the QR for **Computer Laboratory 2** (`CL-LAB-2`).
2. A **student** on a phone (same Wi-Fi, opening the dev server's network URL) scans it. The report form opens with the lab pre-filled and **no login**.
3. The student enters student number `2024-00123`, turns on *Report anonymously*, searches **`CL2-PC15`** under *What is it?* (or types "pc15" or "Computer Laboratory 2"), types "Computer 15 won't turn on", taps **Suggest with AI** (Claude picks *Computers · Medium*), attaches a photo and taps **Submit**. They get ticket `CF-00xxxx`.
4. **Teacher** (second browser, *Staff sign in*) sees a live toast. They open the ticket, mark it **Valid** (+10 credits), then **In Progress** with a note, and post a comment.
5. The student's ticket page updates live. On *Reports feed → My reports* they see their report, and they reply in the comments.
6. Staff mark it **Resolved** (+5 bonus). On */leaderboard* the student's 15 credits appear under `2024-•••23`.
7. *Analytics* shows the most-reported problem categories, the hotspot rooms, and reports vs. fixes over 30 days.

---

## Project structure

```
hackathon-starter/
├── client/src/
│   ├── pages/            report/ (home = public report form, QR route) · ReportsPage (public feed) ·
│   │                     TicketPage (public + comments) · LeaderboardPage · auth/ (staff login, teacher signup) ·
│   │                     staff/ (dashboard, tickets, analytics, locations) · Settings
│   ├── components/       ui/ · shared/ · layout/ · feedback/ · report/ · tickets/ (Comments, ReviewPanel…) · locations/ · auth/
│   ├── services/         tickets, comments, locations, photos, analytics (+ leaderboard), profiles (Supabase) ·
│   │                     triageService (Express)
│   ├── providers/        AuthProvider (staff session + profile/role), ThemeProvider
│   └── lib/              supabase client + query helper, constants (enums, credits), studentIdentity (device-saved student no.)
├── server/
│   ├── src/              routes/triage · services/triage.service (Claude) · middleware/rateLimit
│   └── scripts/          seed-demo.js
└── database/             schema.sql (tables, triggers, views, realtime, storage) · seed.sql
```

### Data model

- `profiles` holds staff accounts only (teacher, lab_assistant, maintenance or admin). Sign-up always creates a `teacher`.
- `locations` holds one row per room, with a `code` that its QR code encodes.
- `equipment` holds individual items with a sticker ID (`short_code`, e.g. `CL2-PC15`), a name, a description and a location. Students report by searching an Equipment ID, name or room; `tickets.equipment_id` links the report to the item.
- `tickets` holds the auto-numbered `CF-000123` tickets.
  - The reporter is either a student (`student_no`, `reporter_name`, `is_anonymous`) or a staff member (`reporter_id`).
  - Each ticket also has a category, severity, status, photos, Claude's suggestions, and the staff review (`validity`, which is unreviewed, valid or invalid).
- `ticket_updates` is the status timeline. Staff changes go through `update_ticket_status()`.
- `ticket_comments` holds the public discussion. Staff comment with `author_id`; students with `student_no`, which can be anonymous.
- The views are `ticket_overview`, `ticket_stats_by_category`, `ticket_stats_by_location`, `ticket_daily_counts` and `student_credits` (the leaderboard).

> **Prototype security:** RLS is disabled on the public tables, so anyone with the anon key can read and write them (see CLAUDE.md). Student numbers aren't verified, so anyone can type any number. Before a real deployment, add verification (for example, school SSO) and enable RLS so that only staff can change status and review reports. `/api/triage` is public and rate-limited to 10 requests per 5 minutes per IP.
