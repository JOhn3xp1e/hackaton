# Project Overview
- **Goal:** Choose one-related school problem, explain who it affects, and build a working prototype that makes it better.
Starting point: Student services, class activities, schedules, attendance or any other campus process. These are examples not limits.
- **Context:** Hackathon MVP. Prioritize working end-to-end features, clean UI, and speed over enterprise scalability or edge-case abstractions.
# Chosen Prototype:
CampusFix – Campus Facility & Equipment Reporting System

Problem: Students and teachers may encounter broken computers, malfunctioning projectors, damaged chairs, electrical problems, or poor internet connectivity. Reporting these problems and following up can be inconvenient.

Who it affects:
- Students
- Teachers
- Laboratory assistants
- Maintenance personnel
- School administrators
Proposed solution:

A centralized reporting system where students and employees can report campus problems and track their resolution.

Main features:
- QR code per classroom or laboratory.
- Report an issue with photos.
- Select issue category and severity.
- Automatic report/ticket number.
- Track report status (Pending, In Progress, Resolved).
- Admin dashboard for managing reports.
- Analytics showing frequently reported problems.
Example scenario:

A student notices that Computer 15 isn't working.
1. Scans the QR code inside the laboratory.
2. Selects Computer/Laboratory Equipment.
3. Uploads a picture and describes the issue.
4. Maintenance receives the report.
5. Student can track its progress.
This is useful because it addresses a problem that your existing school platforms don't necessarily cover.

# Tech Stack
- **Frontend:** React 19 (Vite), **JavaScript** (.jsx — decided to stay JS for speed; shapes enforced with Zod), Tailwind CSS v4, Lucide Icons, shadcn/ui conventions, Motion, React Router 7, `qrcode`
- **Backend:** Node.js, Express 5 (JavaScript, ESM)
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Storage bucket `ticket-photos`, Realtime, `@supabase/supabase-js`)
- **AI / External APIs:** Anthropic SDK (`@anthropic-ai/sdk`) — Claude auto-triage at `POST /api/triage`; Groq (plain `fetch`, OpenAI-compatible, default model `openai/gpt-oss-120b`) — staff assistant at `POST /api/chat`

# Architecture & Boundaries
- **Frontend-to-Supabase:** Use the Supabase client directly in React for standard CRUD operations, Auth, and Realtime listeners. Do NOT build Express endpoints for basic database reads/writes.
- **Node.js Backend Role:** Reserve the `/server` Express app strictly for operations requiring secret environment variables (LLM calls, webhooks, third-party API keys).
- **Database Security:** Assume Supabase Row Level Security (RLS) is DISABLED during rapid prototyping unless explicitly instructed otherwise. Do not write RLS policies unless asked.

# Roles & Product Rules (v2)
- **Students have no account.** They report from the public home page (`/`, or `/r/:locationCode` from a QR code) with a required student number, an optional name and an anonymous toggle. The number is remembered on the device (`lib/studentIdentity.js`).
- **Teachers sign up with email and password (role `teacher`) and count as staff.** `STAFF_ROLES` = teacher, lab_assistant, maintenance and admin. Only `admin` manages locations and QR codes.
- **Students can only report an issue.** The only student-facing pages are `/` and `/r/:code`, plus the ticket page reached through the "Track it" link after submitting. The **reports feed (`/reports`, with a "By student" filter) and `/leaderboard` are staff-only.** Ticket comments: staff comment as their profile, students with their student number. The student number placeholder is `2000XXXXXX`.
- **Equipment:** every item has a sticker ID (`equipment.short_code`, e.g. `CL2-PC15`) and belongs to a location. The report form's **"What is it?"** section searches equipment by ID, name or room (`services/equipmentService.js`, `components/report/EquipmentPicker.jsx`). The ticket takes `equipment_id` and its location from the picked item. Admins manage equipment and print ID labels from Campus Map (`components/locations/EquipmentManager.jsx`).
- **"Report an issue" is for students only.** It's hidden from signed-in staff in the sidebar (`hideForRoles`), and staff opening `/` are redirected to `/dashboard`. Room QR links (`/r/:code`) still work for everyone.
- **Credits:** staff mark a student report `valid` or `invalid` (`tickets.validity`). Valid = +10, plus +5 when resolved. Computed by the `student_credits` view, mirrored in `CREDITS` in `client/src/lib/constants.js`. Shown to staff on `/leaderboard`.
- **`POST /api/triage` is public and rate-limited per IP.**
- **CampusFix Assistant (`POST /api/chat`) is staff-only.** The `requireStaff` middleware checks the Supabase Bearer token and role. Groq answers through read-only DB tools (`server/src/services/chatTools.js`) and never writes data. UI: floating `components/assistant/ChatWidget.jsx`, rendered in `AppLayout` for staff. Env: `GROQ_API_KEY`, `GROQ_MODEL`.

# Directory Structure
All app code lives in `hackathon-starter/`:
- `client/` - React frontend (`src/components`, `src/pages`, `src/services`, `src/lib/supabase.js`, `src/lib/constants.js` for domain enums)
- `server/` - Express backend (`src/routes`, `src/services`, `src/server.js`, `scripts/seed-demo.js`)
- `database/` - SQL schema and seed (`schema.sql`, `seed.sql`)

# Coding Standards & Rules
1. **No Placeholders or Mocks:** Never leave `// TODO` comments, mocked API responses, or dummy `setTimeout` delays. Write real, functional integrations.
2. **Schema Alignment:** Keep `client/src/lib/constants.js`, Zod schemas, and `server/src/validators/triage.schema.js` strictly aligned with the CHECK constraints in `database/schema.sql`.
3. **Minimal Dependencies:** Do not install new npm packages without asking first. Stick to Tailwind CSS and existing libraries.
4. **Error Handling:** Always wrap external API calls and Supabase queries in `try/catch` blocks and surface clear, user-friendly toast/UI error states for live demos.
5. **UI Polish:** Build responsive, high-contrast UIs. Always include loading skeletons/spinners and realistic empty states.

# Common Commands
Run from `hackathon-starter/`:
- **Install:** `npm run setup`
- **Start both:** `npm run dev` (or `npm run dev:client` / `npm run dev:server`)
- **Build check:** `npm run build`
- **Server tests:** `npm run test:api`
- **Demo data:** `npm run seed:demo --prefix server`

# Workflow Instructions
- Before building any multi-file feature, enter Plan Mode, outline the exact files to create/modify, and ask clarifying questions if database columns or API payloads are ambiguous.
- After modifying database tables, immediately update `database/schema.sql` and the matching constants/Zod schemas.
