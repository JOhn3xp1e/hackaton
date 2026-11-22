# Hackathon Starter Kit

A reusable full-stack foundation for an 8-hour hackathon with three people (frontend, backend, database). It's deliberately **problem-agnostic**: a design system, a component library, an example CRUD resource running end to end, and a playbook for adapting it to whatever brief you get.

| Layer | Stack |
| --- | --- |
| Frontend | React 19 · Vite 7 · JavaScript · Tailwind CSS 4 · shadcn/ui conventions (Radix) · Motion · Lucide · React Router 7 · Zod |
| Backend | Node.js ≥ 20.19 · Express 5 · REST · Zod validation · CORS · dotenv |
| Database | Supabase · PostgreSQL · `@supabase/supabase-js` · RLS |
| Tooling | npm · Git/GitHub · Postman collection · Node built-in test runner |

---

## Quick start

```bash
# 1. Install everything (root + client + server)
npm run setup

# 2. Create local env files (defaults work out of the box)
cp client/.env.example client/.env
cp server/.env.example server/.env

# 3. Run frontend + backend together
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:4000/api/health>

**No Supabase account is needed to start.** The frontend runs on mock data (`VITE_USE_MOCKS=true`) and the API falls back to an in-memory store. Connect Supabase whenever the database is ready (see [`database/README.md`](database/README.md)).

### Scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run setup` | Install root, client and server dependencies |
| `npm run dev` | Client and server concurrently, with colour-coded logs |
| `npm run dev:client` / `dev:server` | Run one side only |
| `npm run build` | Production build of the client → `client/dist` |
| `npm start` | Start the API without the file watcher |
| `npm run test:api` | API test suite (13 tests, CRUD, validation and error cases) |

---

## Project structure

```
hackathon-starter/
├── client/                         React app (Frontend dev)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 primitives — button, input, modal, tabs, toast, …
│   │   │   ├── shared/             composites — DataTable, StatCard, PageHeader, Charts, …
│   │   │   ├── layout/             AppLayout, Sidebar, Navbar, menus
│   │   │   └── feedback/           EmptyState, ErrorState, LoadingSkeleton, ErrorBoundary
│   │   ├── pages/                  Dashboard, items/ (CRUD reference), Components, Settings, 404
│   │   ├── hooks/                  useAsync, useMutation, useForm, useDebounce, useDisclosure, …
│   │   ├── services/               apiClient + one service per resource (mock ⇄ http switch)
│   │   ├── lib/                    config, utils, motion presets, zod schemas, supabase client
│   │   ├── data/                   navigation + mock/ data (clearly labelled)
│   │   ├── providers/              ThemeProvider
│   │   ├── styles/globals.css      ← design tokens (re-theme here)
│   │   ├── App.jsx                 routes
│   │   └── main.jsx                providers
│   └── components.json             shadcn/ui config
├── server/                         Express API (Backend dev)
│   ├── src/
│   │   ├── config/                 env (validated), supabase client
│   │   ├── routes/                 /api/health, /api/items
│   │   ├── controllers/            thin HTTP handlers
│   │   ├── services/               business logic + data access (Supabase or in-memory)
│   │   ├── validators/             Zod request schemas
│   │   ├── middleware/             validate, errorHandler, notFound, requestLogger
│   │   ├── utils/                  ApiError, response helpers, case conversion
│   │   ├── app.js                  app factory (testable)
│   │   └── server.js               listen + graceful shutdown
│   └── tests/api.test.js
├── database/                       SQL (Database dev)
│   ├── schema.sql                  tables, constraints, trigger, RLS (re-runnable)
│   ├── seed.sql                    demo data (idempotent)
│   ├── examples/crud.sql
│   └── README.md
└── docs/
    ├── API_CONTRACT.md             ← the team agreement
    ├── DATABASE_GUIDE.md
    ├── TEAM_WORKFLOW.md            roles, git, commits, timeline
    ├── HACKATHON_ADAPTATION_GUIDE.md  ← read this when the brief drops
    ├── DESIGN_SYSTEM.md
    └── postman_collection.json
```

---

## How data flows

```
Page  →  hook (useAsync / useForm)  →  service (itemsService)  ─┬─ mock branch  → data/mock/*      (VITE_USE_MOCKS=true)
                                                                 └─ http branch  → apiClient → /api  (VITE_USE_MOCKS=false)
                                                                                          │
                                         Express: route → validate (Zod) → controller → service ─┬─ Supabase (if SUPABASE_* set)
                                                                                                └─ in-memory store
```

- **Same response shape everywhere:** `{ success, data, meta }` or `{ success: false, error: { code, message, details } }`.
- **Switching mock to real:** change `VITE_USE_MOCKS` in `client/.env` and restart Vite. No page code changes.
- **Switching memory to Supabase:** fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` and restart the API.

## What's included

**Design system:** tokenised light and dark themes, a blueprint grid, editorial typography (Inter Tight, Inter, JetBrains Mono), restrained shadows. → [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

**Components (all working, all demoed at `/components`):** Button · Input · Textarea · Select · Checkbox · Badge · Card · Modal · Confirmation Dialog · Dropdown · Tabs · Tooltip · Toast · Data Table · Search Bar · Pagination · Sidebar · Navbar · Breadcrumbs · Stat Card · Empty State · Loading Skeleton · Error State · Page Header · Form Container, plus Field, Avatar, Spinner, Charts, Animated Counter, Text Reveal and Error Boundary.

**Motion:** page transitions, staggered entrances, text reveals, button and card micro-interactions, modal enter and exit, sidebar collapse and drawer, animated counters, loading states. It respects `prefers-reduced-motion`.

**Sample dashboard (`/`):** responsive sidebar, top nav, KPI stat cards, an area chart and a bar chart, a recent-activity table, quick actions, notifications and a profile dropdown. All of it uses clearly labelled mock data.

**CRUD reference (`/items`):** search, filter, server-side pagination, create and edit modal with client and server validation, delete confirmation, toasts. **Copy this page for your real resource.**

**Backend:** health and DB-readiness endpoints, a full items REST API, Zod validation (422 with per-field details), a central error handler, CORS whitelist, validated env, request logging, tests.

**Database:** a schema with CHECK constraints, indexes, an `updated_at` trigger, RLS policies and templates (owner-based policies, a related table), idempotent seed data, example queries.

---

## Environment variables

| File | Variable | Default | Notes |
| --- | --- | --- | --- |
| `client/.env` | `VITE_APP_NAME` | Hackathon Starter | Shown in the sidebar |
| | `VITE_API_URL` | `/api` | Full URL in production |
| | `VITE_PROXY_TARGET` | `http://localhost:4000` | Dev proxy target |
| | `VITE_USE_MOCKS` | `true` | `false` = real API |
| | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | empty | Optional, **anon key only** |
| `server/.env` | `PORT` | `4000` | |
| | `CORS_ORIGIN` | `http://localhost:5173,…` | Comma-separated |
| | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | empty | **Service role key is server-only** |

> 🔒 Never commit `.env` files (they're git-ignored). Never put a service-role key in `client/` or in any `VITE_*` variable.

## Hackathon day

1. Read [`docs/HACKATHON_ADAPTATION_GUIDE.md`](docs/HACKATHON_ADAPTATION_GUIDE.md) together (step by step, with time boxes).
2. Follow [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md) for branches, commits and the sync points.
3. Agree on endpoints in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) **before** coding.

## Pre-hackathon checklist (do this the week before)

- [ ] Every teammate clones the repo and runs `npm run setup && npm run dev` successfully.
- [ ] Node ≥ 20.19 everywhere (`node -v`).
- [ ] Push to a GitHub repo and add all three teammates. Protect `main` if you like.
- [ ] Create a Supabase project, run `schema.sql` and `seed.sql`, and confirm `/api/health/db` reports `supabase`.
- [ ] Import `docs/postman_collection.json` into Postman.
- [ ] Do a practice deploy: client to Vercel or Netlify, API to Render or Railway.
- [ ] Each person reads their own doc, and everyone browses `/components`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| UI shows "Cannot reach the server" | The API isn't running (`npm run dev:server`), or `VITE_PROXY_TARGET` is wrong |
| `Port 4000 is already in use` | Change `PORT` in `server/.env` **and** `VITE_PROXY_TARGET` in `client/.env` |
| CORS error in production | Add the deployed frontend URL to `CORS_ORIGIN` |
| Env change has no effect | Restart Vite or the server. Env is read at startup |
| API says `data → in-memory store` | `SUPABASE_URL` or the key is missing in `server/.env` |
| Supabase `permission denied` from the browser | RLS is working: add a policy, or route the call through the API |
| `npm install` warns about esbuild install scripts | Harmless on npm 11. The esbuild binary still ships as an optional dependency |
