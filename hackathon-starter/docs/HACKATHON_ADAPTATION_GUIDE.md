# Hackathon Adaptation Guide — from problem statement to demo in 8 hours

Follow this when the problem statement is revealed. The times assume the timeline in `TEAM_WORKFLOW.md`.

---

## Step 1 — Analyse the problem (0:00–0:20)

Read the brief **twice**, then answer these together, out loud, and write the answers in the README:

1. **Who is the user?** Pick one primary persona, for example "a clinic receptionist".
2. **What is their pain?** One sentence.
3. **What does success look like for them?** One measurable outcome.
4. **What are the judging criteria?** Highlight every word in the rubric. Build what is scored.
5. **What data exists?** Entities (nouns) and actions (verbs).

Underline the **nouns** in the brief: they become **tables**. Circle the **verbs**: they become **endpoints and buttons**.

> Example brief: *"Help community food banks track donations and distribute to families in need."*
> Nouns: food bank, donation, family, distribution. Verbs: log a donation, register a family, schedule a distribution, view stock.

## Step 2 — Identify the MVP (0:20–0:35)

List every feature idea, then sort each one into a bucket:

| Must (MVP) | Should (if time) | Won't (pitch only) |
| --- | --- | --- |
| The single core flow the demo shows | Filters, charts, export | Auth, payments, ML, mobile app |

Rules of thumb:
- **One core flow, done well,** beats five half-flows. The demo is about 3 minutes.
- An MVP is typically **2–3 tables, 6–10 endpoints and 3–4 pages**.
- **Skip auth** unless judges score it. Fake the current user with `mockUser`.
- Any feature that doesn't appear in the demo script is a "Won't".

## Step 3 — Map features to pages (0:35–0:45)

| Page (route) | Built from | Data |
| --- | --- | --- |
| `/` Dashboard | `DashboardPage.jsx` (keep StatCards, chart, table) | `GET /stats/overview` |
| `/<entities>` List and CRUD | **copy** `pages/items/ItemsPage.jsx` | `GET/POST/PATCH/DELETE /<entities>` |
| `/<entities>/:id` Detail | `PageHeader`, `Card`, `Tabs`, `DataTable` | `GET /<entities>/:id` |
| `/settings` | `SettingsPage.jsx` patterns | optional |

Steps:
1. Rename `navSections` in `client/src/data/navigation.js`.
2. Add routes in `client/src/App.jsx`.
3. Delete `ComponentsPage` from the nav before the demo. Keep the file, though: it's your component reference.

## Step 4 — Update database tables (Database dev, 0:45–2:00)

1. In `database/schema.sql`, rename `items` to your main entity, or copy the TEMPLATE block for each new table.
2. Mirror every validation rule as a `CHECK` constraint.
3. Add foreign keys, indexes, the `updated_at` trigger, and `enable row level security`.
4. Run the script in Supabase, then write `seed.sql` with **realistic demo data**: real-looking names, a spread of statuses, and dates within the past few weeks.
5. Share the column list with Backend.

## Step 5 — Create API endpoints (Backend dev, 0:45–3:30)

For each resource, copy the `items` files and rename them:

```
server/src/validators/items.schema.js     → <entity>.schema.js     (Zod rules)
server/src/services/items.service.js      → <entity>.service.js    (TABLE name, memory seed)
server/src/controllers/items.controller.js → <entity>.controller.js
server/src/routes/items.routes.js          → <entity>.routes.js
server/src/routes/index.js                 → router.use('/<entities>', <entity>Routes)
```

Then:
- Add custom actions as `POST /<entities>/:id/<action>` (for example `/donations/:id/approve`).
- Add aggregates for the dashboard: `GET /stats/overview` (the SQL examples are in `database/examples/crud.sql`).
- Add 2–3 tests per resource in `server/tests/api.test.js`, and add the requests to Postman.
- Update `docs/API_CONTRACT.md` as you go.

## Step 6 — Replace mock data (Frontend dev, 1:00 → 4:00)

The frontend never imports mock data directly. Pages call **services**, and each service has a `mock` branch and an `http` branch that return the **same shape**.

1. Copy `client/src/services/itemsService.js` to `<entity>Service.js`, then update the paths and fields.
2. Write `client/src/data/mock/<entity>.js` in the exact contract shape (camelCase).
3. Copy `pages/items/` to `pages/<entities>/`, then update the columns, form fields and `lib/schemas.js`.
4. Build everything against mocks (`VITE_USE_MOCKS=true`).
5. When the API is live, set `VITE_USE_MOCKS=false` in `client/.env` and restart Vite. **No page code changes.**
6. For the dashboard, set `USE_REAL_DASHBOARD_API = true` in `dashboardService.js` once `/stats/overview` exists.

## Step 7 — Re-theme (Frontend, 15 min, anytime)

Edit only the `:root` and `.dark` blocks in `client/src/styles/globals.css`: `--primary`, `--background`, `--foreground` and `--border`. Every component follows. Then change the `Logo` and `VITE_APP_NAME`. See `docs/DESIGN_SYSTEM.md`.

## Step 8 — Test the complete application (from 5:30)

Run the core flow end to end with everyone watching:

- [ ] `npm run build` (client) succeeds.
- [ ] `npm test` (server) passes.
- [ ] `GET /api/health/db` returns `database: "supabase"`.
- [ ] Create, edit and delete from the UI, then refresh: the data persists.
- [ ] Invalid form input shows field errors, from the client and from the server (try bypassing the form in Postman).
- [ ] Stop the API: the UI shows an `ErrorState` with retry instead of a blank screen.
- [ ] Empty search shows the `EmptyState`.
- [ ] Check at 390px width (Chrome DevTools device mode).
- [ ] Toggle dark mode on every page.
- [ ] No red errors in the browser console.

## Step 9 — Prepare the final demonstration (7:00–8:00)

**Story structure (3 minutes):**
1. **Problem (20s):** a persona plus the pain, ideally with a number.
2. **Solution (10s):** one sentence.
3. **Live demo (2 min):** the core flow only, with seeded realistic data. Start from the dashboard and finish where the user's pain is solved.
4. **How it's built (20s):** React + Express + Supabase, RLS security, API-first design.
5. **What's next (10s):** two or three "Won't" items from Step 2.

**Checklist:**
- [ ] Remove "Mock data" badges and the Components page from the nav.
- [ ] Seed fresh demo data, and remove test rows such as "asdf".
- [ ] Deploy if possible: client to Vercel or Netlify (`npm run build`, publish `client/dist`), server to Render or Railway. Set the env vars on each platform and set `VITE_API_URL` to the deployed API URL plus `/api`.
- [ ] Keep a **local fallback**: run everything on one laptop with `npm run dev`.
- [ ] Record a 60-second **backup video** of the demo in case the Wi-Fi fails.
- [ ] Rehearse twice and time it. One person drives and one person talks.
- [ ] Browser zoom at 110–125%, notifications off, bookmarks bar hidden.
- [ ] `git tag demo && git push --tags`.
