-- ═══════════════════════════════════════════════════════════════════════════
-- HACKATHON STARTER — DATABASE SCHEMA (Supabase / PostgreSQL 15+)
-- ───────────────────────────────────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS.
--
-- Conventions (see docs/DATABASE_GUIDE.md):
--   • tables: plural snake_case         (items, team_members)
--   • columns: snake_case               (created_at, owner_id)
--   • primary key: id uuid              (gen_random_uuid())
--   • foreign keys: <singular>_id       (item_id, user_id)
--   • every table has created_at + updated_at (trigger-managed)
--   • enumerations: text + CHECK constraint (easy to change mid-hackathon)
--   • RLS enabled on EVERY table
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 1. Shared helpers
-- ───────────────────────────────────────────────────────────────────────────

-- Keeps updated_at current on every UPDATE. Attach to each table with a trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- 2. items — the example resource used by the API and the frontend.
--    Rename / extend it once the problem statement is known.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null check (char_length(title) between 3 and 120),
  description  text        not null default '' check (char_length(description) <= 1000),
  status       text        not null default 'todo'
                 check (status in ('todo', 'in_progress', 'done', 'archived')),
  priority     text        not null default 'medium'
                 check (priority in ('low', 'medium', 'high')),
  category     text        not null check (char_length(category) between 1 and 60),
  -- owner_id uuid references auth.users (id) on delete cascade,   -- ← uncomment when adding auth
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.items is 'Example resource for the hackathon starter. Replace with your domain table.';

-- Indexes for the API's common filters and sort order
create index if not exists items_status_idx     on public.items (status);
create index if not exists items_created_at_idx on public.items (created_at desc);

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();


-- ───────────────────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ───────────────────────────────────────────────────────────────────────────
-- How access works in this starter:
--   • Express server uses the SERVICE ROLE key → bypasses RLS entirely.
--     The API is the gatekeeper (validation + authorisation in code).
--   • Browser (if it ever talks to Supabase directly) uses the ANON key →
--     restricted by the policies below.
--
-- Default stance: anon may READ, nobody may WRITE directly from the browser.
alter table public.items enable row level security;

drop policy if exists "items: public read" on public.items;
create policy "items: public read"
  on public.items
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies → those operations are denied for anon and
-- authenticated roles. All writes go through the Express API (service role).


-- ───────────────────────────────────────────────────────────────────────────
-- 4. TEMPLATE — per-user ownership (uncomment when you add Supabase Auth)
-- ───────────────────────────────────────────────────────────────────────────
-- alter table public.items add column if not exists owner_id uuid
--   references auth.users (id) on delete cascade default auth.uid();
--
-- drop policy if exists "items: public read" on public.items;
--
-- create policy "items: owner can read"   on public.items for select to authenticated
--   using ((select auth.uid()) = owner_id);
-- create policy "items: owner can insert" on public.items for insert to authenticated
--   with check ((select auth.uid()) = owner_id);
-- create policy "items: owner can update" on public.items for update to authenticated
--   using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
-- create policy "items: owner can delete" on public.items for delete to authenticated
--   using ((select auth.uid()) = owner_id);
--
-- create index if not exists items_owner_id_idx on public.items (owner_id);


-- ───────────────────────────────────────────────────────────────────────────
-- 5. TEMPLATE — a related table (one-to-many) to copy for new features
-- ───────────────────────────────────────────────────────────────────────────
-- create table if not exists public.comments (
--   id          uuid primary key default gen_random_uuid(),
--   item_id     uuid not null references public.items (id) on delete cascade,
--   body        text not null check (char_length(body) between 1 and 2000),
--   created_at  timestamptz not null default now(),
--   updated_at  timestamptz not null default now()
-- );
-- create index if not exists comments_item_id_idx on public.comments (item_id);
-- create trigger comments_set_updated_at before update on public.comments
--   for each row execute function public.set_updated_at();
-- alter table public.comments enable row level security;
-- create policy "comments: public read" on public.comments for select to anon, authenticated using (true);
