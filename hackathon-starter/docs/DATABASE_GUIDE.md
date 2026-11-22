# Database Guide

Owner: **Database developer**. Quick setup steps are in [`database/README.md`](../database/README.md).

## 1. How the pieces connect

```
Browser (React)  ──/api──▶  Express (server/)  ──supabase-js + SERVICE ROLE──▶  Supabase Postgres
      │                                                                              ▲
      └──── (optional) supabase-js + ANON key, limited by RLS policies ──────────────┘
```

- **Default path:** the browser talks to Express, and Express talks to the database. The server validates every request, so RLS mostly guards against accidental browser access.
- **Optional direct path:** use `client/src/lib/supabase.js` with the anon key for Supabase Auth, Realtime or Storage. Every table the browser touches **must** have explicit policies.

## 2. Configuration

| Where | Variable | Secret? |
| --- | --- | --- |
| `server/.env` | `SUPABASE_URL` | no |
| `server/.env` | `SUPABASE_SERVICE_ROLE_KEY` | **YES — server only, bypasses RLS** |
| `client/.env` | `VITE_SUPABASE_URL` | no |
| `client/.env` | `VITE_SUPABASE_ANON_KEY` | no (public by design, protected by RLS) |

`VITE_*` variables are compiled into the JavaScript bundle and anyone can read them. **A service-role key must never have a `VITE_` prefix.** If one leaks, rotate it immediately in Supabase → Project Settings → API.

When `SUPABASE_*` is missing, the server falls back to an in-memory store with the same API, so nobody is blocked while the database is being designed.

## 3. Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Tables | plural, snake_case | `items`, `team_members` |
| Columns | snake_case | `created_at`, `due_date` |
| Primary key | `id uuid default gen_random_uuid()` | |
| Foreign key | `<singular_table>_id` | `item_id`, `user_id` |
| Timestamps | `created_at`, `updated_at` (`timestamptz`) | trigger keeps `updated_at` current |
| Booleans | `is_` / `has_` prefix | `is_public`, `has_paid` |
| Enum-like | `text` + `CHECK (col in (...))` | easier to change than PG enums |
| Indexes | `<table>_<column>_idx` | `items_status_idx` |
| Policies | `"<table>: <who> can <action>"` | `"items: owner can update"` |
| Functions | verb_noun, snake_case | `set_updated_at()` |

The API exposes camelCase (`createdAt`). The conversion happens in `server/src/utils/case.js`, so **never rename columns just to match JavaScript**.

## 4. Data integrity checklist

- [ ] `NOT NULL` on every column that must exist.
- [ ] `CHECK` constraints mirror the Zod rules (lengths, enums, ranges).
- [ ] Foreign keys declare `on delete cascade | set null | restrict` on purpose.
- [ ] `UNIQUE` constraints on natural keys (emails, slugs). The API maps violations to `409 CONFLICT`.
- [ ] An index on every foreign key and on every column used in `WHERE` or `ORDER BY`.
- [ ] Seed data covers every status, the empty states and edge cases, for the demo.

## 5. Row Level Security (RLS)

1. **Enable RLS on every table**: `alter table x enable row level security;`
2. With RLS on and no policies, `anon` and `authenticated` are **denied everything**. Start from there and open access deliberately.
3. The service role (used by Express) **bypasses RLS**, so authorisation for API calls lives in the controllers and services.
4. Common policy patterns:

```sql
-- Public read-only
create policy "t: public read" on t for select to anon, authenticated using (true);

-- Owner-only (requires Supabase Auth + owner_id column)
create policy "t: owner can read"   on t for select to authenticated using ((select auth.uid()) = owner_id);
create policy "t: owner can write"  on t for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "t: owner can update" on t for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
```

5. Wrapping `auth.uid()` in `(select …)` lets Postgres cache it per statement, which is much faster on large tables.
6. To check your policies, run the last query in `examples/crud.sql`, or try the anon key from the browser and confirm that writes fail.

## 6. CRUD with supabase-js (server)

`server/src/services/items.service.js` is the reference implementation:

```js
// list + filter + search + sort + pagination
const { data, error, count } = await supabase
  .from('items')
  .select('*', { count: 'exact' })
  .eq('status', 'todo')
  .or('title.ilike.%demo%,description.ilike.%demo%')
  .order('created_at', { ascending: false })
  .range(0, 9)

// read one
await supabase.from('items').select('*').eq('id', id).maybeSingle()

// create
await supabase.from('items').insert({ title, category }).select().single()

// update
await supabase.from('items').update({ status: 'done' }).eq('id', id).select().maybeSingle()

// delete
await supabase.from('items').delete().eq('id', id).select('id')

// join a related table (FK comments.item_id → items.id)
await supabase.from('items').select('*, comments(*)').eq('id', id).single()
```

Always check `error`. `dbError()` in the service maps Postgres codes (`23505`, `23503`, `23514`) to friendly API errors.

## 7. Adding a new table (about 15 minutes)

1. Copy the `TEMPLATE — related table` block in `schema.sql`, rename it, and adjust the columns and constraints.
2. Add the `set_updated_at` trigger, enable RLS and add policies.
3. Run it in the SQL Editor, then add seed rows.
4. Send the backend developer the column list. They copy `items.service.js` and change `TABLE`.
5. Update `docs/API_CONTRACT.md`.

## 8. Migrations during a hackathon

Keep it simple: `schema.sql` is the single source of truth. Write every change so the script can be re-run (`if not exists`, `create or replace`, `drop policy if exists`). If you want proper versioned migrations later, use the Supabase CLI: `supabase migration new <name>`.
