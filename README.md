

# CampusFix

**Campus facility and equipment reporting.** A student spots a broken computer, projector, chair, light or Wi-Fi problem. They scan a QR code, report it in under a minute without creating an account, and follow the repair until it's fixed. Maintenance staff get a live dashboard, AI triage, a 3D campus map and analytics on the most-reported problems.

> Built as a hackathon prototype. The app works end to end on real data (Supabase, Realtime, Storage), but some security shortcuts were taken on purpose; see [Prototype limitations](#prototype-limitations).

---
## Links:
Site: https://hackathon-starter-navy.vercel.app

Presentation: https://claude.ai/artifact/8Vd2UK8tNEq5NzoCDPdekp?sk=RJH6O-RWEAi1AsnNMeHiJQ#slide-778c791d7342

## Contents

- [The problem](#the-problem)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack and architecture](#tech-stack-and-architecture)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Demo accounts](#demo-accounts)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Server API](#server-api)
- [Deployment (Vercel)](#deployment-vercel)
- [Scripts](#scripts)
- [Prototype limitations](#prototype-limitations)

---

## The problem

Broken lab computers, dead projectors, damaged chairs, electrical faults and bad Wi-Fi get reported by word of mouth, if at all. Nobody knows whether a problem was already reported, and the person who reported it never hears back.

**Who it affects:** students, teachers, laboratory assistants, maintenance personnel and school administrators.

**CampusFix** gives every room and every item a QR code and an ID. Anyone can report a problem against the exact item. Maintenance works a prioritized queue, and the reporter tracks the status from **Pending → In Progress → Resolved**.

---

## Features

### Students (no account)
- **Scan and report.** A room QR code (`/r/CL-LAB-2`) or an equipment QR code (`/e/CL2-PC15`) opens the report form with the room or item already filled in.
- **"What is it?" search.** Find the broken item by its Equipment ID (`CL2-PC15`), its name ("projector") or its room ("Computer Laboratory 2"). The equipment already knows where it is.
- **Category, severity and up to 3 photos.**
- **AI suggest:** Claude reads the description and proposes a category, a severity and a one-line summary for the technician.
- **Identity:** a student number (`2000XXXXXX`) is required. The name is optional, students can report anonymously, and they can leave an email to receive updates.
- **Automatic ticket number** (`CF-001234`) and a public progress page at `/track/CF-001234`.
- **Credits:** a report that staff mark *Valid* earns **+10**, and **+5 more** when it's resolved.

### Teachers and maintenance staff (sign in)
- **Overview dashboard.** Live stat cards, a priority queue sorted by severity then age, a banner for critical issues, a "reports awaiting review" banner, and analytics: reports vs. fixes over 30 days, most-reported categories and problem hotspots.
- **Real-time:** new reports trigger a toast and a notification. Every status change appears for everyone instantly.
- **Ticket page:**
  - change the status with a note, assign a technician;
  - review the report as **Valid** or **Invalid** (this awards credits);
  - comment, email the reporter, and (admins only) delete the report.
- **Track Reports** (the feed, filterable by student), **Maintenance Tasks** (the full ticket table with filters) and the **Leaderboard** (students ranked by credits).
- **3D Campus Map:** rooms are colored by type. Rooms with urgent open issues are flagged, and clicking a room lists its open issues.
- **Staff assistant:** a chat widget that answers questions about live report data, for example "Which lab has the most open tickets?". It runs on Groq with read-only tools.

### Administrators
- **Equipment:** add, edit and delete items, each with its own printable QR sticker.
- **Rooms:** manage rooms and their QR codes from the Campus Map.
- **Settings → Data mode:** switch the whole app between **Production** (real reports only) and **Mock data** (real reports plus seeded demo data). While demo data is visible, a "Mock data" badge shows in the top bar.

---

## How it works

The golden path, from scan to fix:

1. A student scans the QR sticker on **Computer 15** in Computer Laboratory 2. The form opens with `CL2-PC15` selected.
2. They enter their student number, type "Won't turn on", tap **Suggest with AI**, attach a photo and submit. They get ticket `CF-00xxxx` and a **Track it** link.
3. Maintenance sees a live toast. The ticket sits at the top of the priority queue.
4. Staff mark it **Valid**, which gives the student +10 credits. They set it to **In Progress** with a note, and later to **Resolved**, which adds +5.
5. The student's tracking page updates live at every step. Analytics, the campus map and the leaderboard update too.

---

## Tech stack and architecture

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, JavaScript, Tailwind CSS v4, shadcn/ui conventions (Radix), Motion, Lucide icons, React Router 7, Zod, `qrcode`, `three` (3D campus map) |
| Data | Supabase: PostgreSQL, Auth, Storage (`ticket-photos` bucket) and Realtime. The browser calls it directly with `@supabase/supabase-js`. |
| Server | Node.js 22 with Express 5, used only for work that needs secret keys |
| AI | Claude (`@anthropic-ai/sdk`) for report triage; Groq for the staff assistant |
| Hosting | Vercel: static client, with Express running as a serverless function under `/api` |

```
 Browser (React)
   │
   ├──► Supabase ── tickets, equipment, comments, auth, photo storage, realtime
   │        (CRUD goes straight from the browser to the database)
   │
   └──► /api (Express, holds the secret keys)
          ├─ POST /api/triage → Claude  (category, severity, summary)
          └─ POST /api/chat   → Groq    (staff assistant, read-only tools)
```

The rule is simple: **if it doesn't need a secret key, it doesn't go through Express.**

---

## Getting started

### Prerequisites
- **Node.js 22**
- A free **Supabase** project ([supabase.com](https://supabase.com))
- Optional: an **Anthropic API key** for AI triage, and a **Groq API key** for the staff assistant. The app works without them; those two features show a "not configured" message instead.

### 1. Install

```bash
git clone https://github.com/JOhn3xp1e/hackaton.git
cd hackaton/hackathon-starter
npm run setup                    # installs root, client and server dependencies
```

### 2. Environment files

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Fill them in as described in [Configuration](#configuration).

### 3. Database

In the Supabase dashboard, open the **SQL Editor** and run these two files in order:

1. `hackathon-starter/database/schema.sql`: the tables, triggers, views, Realtime setup and the photo storage bucket. It's safe to run again after pulling updates.
2. `hackathon-starter/database/seed.sql`: 12 campus rooms and about 55 pieces of equipment, each with an ID.

Recommended for demos: under **Authentication → Providers → Email**, turn off **"Confirm email"** so new teacher accounts can sign in immediately.

### 4. Demo data (optional)

```bash
npm run seed:demo --prefix server
```

This creates the staff accounts, about 35 student reports spread over the last 30 days with reviews and comments, and the super admin. Everything it creates is marked as demo data, so **Settings → Data mode → Production** can hide it.

### 5. Run

```bash
npm run dev
```

- App: <http://localhost:5173>
- API health: <http://localhost:4000/api/health>

---

## Configuration

### `client/.env` (exposed to the browser: never put secret keys here)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anon / publishable key |
| `VITE_PUBLIC_APP_URL` | recommended | Public site URL used inside QR codes, e.g. your Vercel URL. If it's empty, QR codes point to `localhost`. |
| `VITE_API_URL` | no | Defaults to `/api` |
| `VITE_PROXY_TARGET` | no | The dev proxy target for `/api`. Defaults to `http://localhost:4000`. |
| `VITE_APP_NAME` | no | Display name. Defaults to `CampusFix`. |

### `server/.env` (secret: git-ignored)

| Variable | Required | Description |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) | yes | Server-only key. Used to verify staff sessions, by the assistant's tools and by the seed script. |
| `ANTHROPIC_API_KEY` | optional | Enables **Suggest with AI** (Claude triage) |
| `GROQ_API_KEY` / `GROQ_MODEL` | optional | Enables the staff assistant. The model defaults to `openai/gpt-oss-120b`. |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | optional | The account `seed:demo` creates. The defaults are below. |
| `CORS_ORIGIN`, `PORT` | no | Defaults to `http://localhost:5173` and `4000` |

The server also accepts the newer Supabase key names (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`). If its own Supabase variables aren't set, it falls back to the `VITE_SUPABASE_*` ones.

---

## Demo accounts

These are created by `npm run seed:demo --prefix server`.

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@gmail.com` | `admin123` |
| Admin | `admin@campusfix.demo` | `CampusFix2026!` |
| Maintenance | `maintenance@campusfix.demo` | `CampusFix2026!` |
| Lab assistant | `labassistant@campusfix.demo` | `CampusFix2026!` |
| Teacher | `teacher@campusfix.demo` | `CampusFix2026!` |

**Students don't sign in.** They report from the home page with a student number. Teachers can create their own account at `/signup`; it gets the `teacher` role, which counts as staff. Other roles are assigned by an admin.

> These are demo credentials. Change them, or skip the seed, before putting real data in.

---

## Project structure

```
hackaton/
├── README.md                  ← you are here
├── CLAUDE.md                  project rules and context for AI-assisted development
├── PROMPT_TEMPLATE.md         the kickoff prompt used to scaffold the project
└── hackathon-starter/
    ├── client/                React app (Vite)
    │   └── src/
    │       ├── pages/         report/ (student form, QR routes) · TicketPage (staff + /track) · ReportsPage ·
    │       │                  LeaderboardPage · CampusMapPage · SettingsPage · staff/ (dashboard, tickets, equipment) · auth/
    │       ├── components/    ui/ (primitives) · layout/ (sidebar, navbar) · report/ · tickets/ · campus/ ·
    │       │                  analytics/ · assistant/ (chat widget) · settings/ · locations/ · auth/
    │       ├── services/      one module per resource (tickets, equipment, locations, comments, analytics…)
    │       ├── providers/     AuthProvider (staff session and role), DataModeProvider, ThemeProvider
    │       └── lib/           supabase client, constants (categories/severity/status/credits), dataMode, studentIdentity
    ├── server/                Express API (secrets only)
    │   ├── src/               routes/ (health, triage, chat) · services/ (triage, chat, chatTools) · middleware/
    │   ├── scripts/           seed-demo.js
    │   └── tests/             node:test suite (no external API calls)
    ├── api/index.js           Vercel serverless entry (wraps the Express app)
    ├── database/              schema.sql · seed.sql
    └── vercel.json
```

---

## Data model

| Table / view | Purpose |
| --- | --- |
| `profiles` | Staff accounts: `teacher`, `lab_assistant`, `maintenance` or `admin`. Created on sign-up. |
| `locations` | Rooms, each with a QR `code`, e.g. `CL-LAB-2` |
| `equipment` | Items with a sticker ID (`short_code`, e.g. `CL2-PC15`), a name, a description and a room |
| `tickets` | Reports, numbered `CF-000123`. Each holds the equipment and location, category, severity, status, photos, Claude's suggestion, reporter (student number + optional name and email, or a staff profile), review (`validity`) and `is_demo`. |
| `ticket_updates` | The status timeline. Staff changes go through `update_ticket_status()`. |
| `ticket_comments` | Public discussion on a ticket. Students comment with a student number, staff with their profile. |
| `app_settings` | App-wide settings. `data_mode` is `production` or `mock`. |
| Views | `ticket_overview`, `ticket_stats_by_category`, `ticket_stats_by_location`, `ticket_daily_counts`, `student_credits` (the leaderboard). All of them respect the data mode. |

**Categories:** computer equipment, projector/AV, furniture, electrical, network/internet, plumbing, air conditioning, other.
**Severity:** low, medium, high, critical.
**Status:** pending, in progress, resolved.

---

## Server API

Express under `/api`. Standard reads and writes go directly to Supabase, not through this API.

| Method and path | Auth | Description |
| --- | --- | --- |
| `GET /api/health` | none | Liveness, plus which integrations are configured (`supabase`, `aiTriage`, `chatbot`) |
| `GET /api/health/db` | none | Database reachability check |
| `POST /api/triage` | none, rate-limited (10 per 5 min per IP) | `{ title, description, assetLabel, locationName }` → `{ category, severity, summary }` from Claude |
| `POST /api/chat` | staff bearer token, rate-limited (30 per 5 min) | The staff assistant. Groq with read-only tools: overview, stats, daily trend, ticket search and lookup, locations, equipment and credits. |

Responses use the envelope `{ success, data }` or `{ success: false, error: { code, message } }`.

---

## Deployment (Vercel)

`hackathon-starter/vercel.json` builds the client into `client/dist` and serves the Express app as one serverless function at `/api/*`.

1. Import the repo in Vercel with **Root Directory** set to `hackathon-starter`.
2. Add the client and server environment variables from [Configuration](#configuration) to the Vercel project.
3. Set `VITE_PUBLIC_APP_URL` to the deployed URL, so printed QR codes open the live site.
4. Add the deployed URL to `CORS_ORIGIN`.

---

## Scripts

Run these from `hackathon-starter/`:

| Command | What it does |
| --- | --- |
| `npm run setup` | Install all dependencies |
| `npm run dev` | Run the client and server together |
| `npm run build` | Production build of the client |
| `npm run test:api` | Server tests: health, validation, auth and rate limits. They make no AI calls. |
| `npm run seed:demo --prefix server` | Create the demo accounts and demo data. Safe to run again. |

---

## Prototype limitations

These are deliberate shortcuts for a hackathon. Fix them before running CampusFix for real:

- **Row Level Security is off.** Anyone with the public anon key can read and write the tables. Turn RLS on and add policies, for example so that only staff can change status, review reports or delete them.
- **Student numbers aren't verified.** Anyone can type any number. Real deployments should use school SSO.
- **Demo credentials** are documented above. Change or remove them.
- **AI triage is public** (rate-limited per IP) because students don't sign in.

---

*Report it. Track it. Fixed.*
