# CampusFix

**Campus facility & equipment reporting.** Students and teachers scan a QR code in any classroom or lab, report a broken computer, projector, chair, light or Wi-Fi problem with photos, and track it until maintenance marks it fixed. Staff get a live dashboard, Claude-powered triage, and analytics on the most-reported problems.

| Who | What they do in CampusFix |
| --- | --- |
| Students & teachers | Scan the room QR → report with photo → get a ticket number → watch status live |
| Lab assistants & maintenance | Priority queue, change status with notes, assign tickets, real-time alerts |
| Administrators | Everything above + manage locations and print QR sticker sheets |

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
5. Create the demo accounts and 30 days of ticket history:

   ```bash
   npm run seed:demo --prefix server
   ```

   This prints the logins (`admin@`, `maintenance@`, `labassistant@`, `teacher@`, `student@campusfix.demo`) and the shared demo password.

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
2. **Student** on a phone (same Wi-Fi, open the dev server's network URL) scans it → signs in → the form opens with the lab pre-filled.
3. Type "Computer 15 won't turn on" → **Suggest with AI** (Claude picks *Computers · Medium* and writes a technician summary) → attach a photo → **Submit** → gets ticket `CF-00xxxx`.
4. **Maintenance** (second browser) sees a live toast and the ticket at the top of the priority queue → opens it → **Mark as In Progress** with a note.
5. The student's ticket page updates instantly, without a refresh. Maintenance then marks it **Resolved**.
6. *Analytics* shows the most-reported problem categories, the hotspot rooms, and reports vs. fixes over 30 days.

---

## Project structure

```
hackathon-starter/
├── client/src/
│   ├── pages/            auth/ (login, signup) · report/ (QR + form) · home/ (reporter, staff) ·
│   │                     staff/ (tickets, analytics, locations) · TicketPage · MyReportsPage · Settings
│   ├── components/       ui/ · shared/ · layout/ · feedback/ · report/ · tickets/ · locations/ · auth/
│   ├── services/         ticketsService, locationsService, photosService, analyticsService,
│   │                     profilesService (Supabase) · triageService (Express)
│   ├── providers/        AuthProvider (session + profile/role), ThemeProvider
│   └── lib/              supabase client + query helper, constants (categories/severity/status)
├── server/
│   ├── src/              routes/triage · services/triage.service (Claude) · middleware/requireAuth
│   └── scripts/          seed-demo.js
└── database/             schema.sql (tables, triggers, views, realtime, storage) · seed.sql
```

### Data model

- `profiles` holds each user's name and role (student, teacher, lab_assistant, maintenance or admin). A trigger creates it on sign-up.
- `locations` holds one row per room, with a `code` that its QR code encodes.
- `tickets` holds the auto-numbered `CF-000123` tickets, with a category, severity, status, photos and Claude's suggestions.
- `ticket_updates` is the status timeline. The first entry is written automatically. Staff changes go through `update_ticket_status()`.
- The analytics views are `ticket_overview`, `ticket_stats_by_category`, `ticket_stats_by_location` and `ticket_daily_counts`.

> **Prototype security:** RLS is disabled on the public tables, so anyone with the anon key can read and write them (see CLAUDE.md). Before a real deployment, enable RLS and add policies, for example so that reporters can only see their own tickets and only staff can update status.
