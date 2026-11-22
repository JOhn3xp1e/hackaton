# Database — Supabase / PostgreSQL

Owner: **Database developer**. Full conventions and security notes are in [`docs/DATABASE_GUIDE.md`](../docs/DATABASE_GUIDE.md).

| File | Purpose |
| --- | --- |
| `schema.sql` | Tables, constraints, indexes, the `updated_at` trigger and RLS policies. Safe to re-run. |
| `seed.sql` | Demo rows with fixed UUIDs (`ON CONFLICT DO NOTHING`, so safe to re-run). |
| `examples/crud.sql` | Copy-paste CRUD, pagination, aggregate and RLS-inspection queries. |

## Setup (about 5 minutes)

1. Create a project at [supabase.com](https://supabase.com). Pick the region closest to the venue.
2. **SQL Editor → New query**: paste `schema.sql` and click **Run**. Then do the same with `seed.sql`.
3. **Project Settings → API**: copy these values:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (**server only**)
   - `anon` / publishable key → only needed if the browser talks to Supabase directly
4. Put them in `server/.env` and restart the server (`npm run dev:server`). The startup log should say `data → Supabase (PostgreSQL)`.
5. Check the connection: `GET http://localhost:4000/api/health/db` should return `{ "status": "ok", "database": "supabase" }`.

> **Until step 4 is done, the API serves an in-memory store** with the same data shape. The frontend and backend can build features before the database is ready.

## Security rules (non-negotiable)

- The **service-role key bypasses RLS**. It goes in `server/.env` only. Never put it in `client/`, a `VITE_*` variable, git, Discord or a screenshot.
- RLS is **enabled on every table**. A table with RLS on and no policy denies everything to `anon` and `authenticated`, which is a safe default.
- The browser may only ever use the **anon** key, and only for tables whose policies you wrote on purpose.

## Changing the schema mid-hackathon

1. Edit `schema.sql`. Use `alter table … add column if not exists …` so the script stays re-runnable.
2. Run the change in the SQL Editor.
3. Tell the backend developer which columns changed (snake_case). The API converts them to camelCase automatically.
4. Update `seed.sql` if the demo needs the new fields.
5. Commit with `feat(db): add <column> to <table>`.
