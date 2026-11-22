-- ═══════════════════════════════════════════════════════════════════════════
-- EXAMPLE CRUD QUERIES — copy/paste into the Supabase SQL Editor.
-- The Express API performs the same operations through supabase-js
-- (see server/src/services/items.service.js).
-- ═══════════════════════════════════════════════════════════════════════════

-- CREATE ────────────────────────────────────────────────────────────────────
insert into public.items (title, description, status, priority, category)
values ('Try the SQL editor', 'Created from examples/crud.sql', 'todo', 'low', 'Docs')
returning *;

-- READ (list with filter, search, sort, pagination) ─────────────────────────
-- page 1, 10 per page  →  offset = (page - 1) * page_size
select *
from public.items
where status = 'todo'
  and (title ilike '%demo%' or description ilike '%demo%')
order by created_at desc
limit 10 offset 0;

-- total for pagination meta
select count(*) from public.items where status = 'todo';

-- READ one
select * from public.items where id = '6f1c2b1e-0000-4000-8000-000000000001';

-- UPDATE (updated_at is set automatically by the trigger) ───────────────────
update public.items
set status = 'done'
where id = '6f1c2b1e-0000-4000-8000-000000000006'
returning *;

-- DELETE ────────────────────────────────────────────────────────────────────
delete from public.items
where title = 'Try the SQL editor'
returning id;

-- AGGREGATES (handy for dashboard stat cards) ───────────────────────────────
select
  count(*)                                          as total,
  count(*) filter (where status = 'done')           as done,
  count(*) filter (where status = 'in_progress')    as in_progress,
  round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 1) as done_pct
from public.items;

-- Items created per day over the last 7 days (chart data)
select date_trunc('day', created_at)::date as day, count(*) as created
from public.items
where created_at > now() - interval '7 days'
group by 1
order by 1;

-- INSPECT RLS policies ─────────────────────────────────────────────────────
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public';
