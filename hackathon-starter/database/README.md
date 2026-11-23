# Database — Supabase / PostgreSQL

| File | Purpose |
| --- | --- |
| `schema.sql` | Tables (`profiles`, `locations`, `tickets`, `ticket_updates`), triggers (sign-up profile, ticket numbers, timeline, `resolved_at`), the `update_ticket_status()` RPC, analytics views, Realtime publication and the `ticket-photos` Storage bucket. Safe to re-run. |
| `seed.sql` | 12 demo campus locations (`ON CONFLICT DO NOTHING`). |

Demo users and historical tickets come from `npm run seed:demo --prefix server`, because they need real Supabase Auth accounts.

## Setup

1. **SQL Editor → New query**: paste `schema.sql`, then click **Run**. Do the same with `seed.sql`.
2. **Project Settings → API**: copy these values.
   - `Project URL` goes in `SUPABASE_URL` (server) and `VITE_SUPABASE_URL` (client).
   - `anon` / publishable key goes in `VITE_SUPABASE_ANON_KEY` (client).
   - `service_role` secret goes in `SUPABASE_SERVICE_ROLE_KEY`. This one is **server only**, used to verify sessions and for the seed script.
3. For the demo, go to **Authentication → Providers → Email** and turn off "Confirm email".

## Changing the schema

1. Edit `schema.sql`. Keep it re-runnable (`add column if not exists`, `create or replace`).
2. Run the change in the SQL Editor.
3. Update the matching constants in `client/src/lib/constants.js`, and `server/src/validators/triage.schema.js` if categories or severities change.

## Security note

RLS is **disabled** on the public tables for rapid prototyping (see CLAUDE.md). The only policies are on `storage.objects`, so that signed-in users can upload photos. Never expose the service-role key in `client/` or in any `VITE_*` variable.
