-- ═══════════════════════════════════════════════════════════════════════════
-- CAMPUSFIX — DATABASE SCHEMA (Supabase / PostgreSQL 15+)
-- ───────────────────────────────────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS.
--
-- Conventions:
--   • tables: plural snake_case, primary key id uuid (except profiles → auth.users)
--   • enumerations: text + CHECK constraint (easy to change mid-hackathon)
--   • RLS is DISABLED on public tables during prototyping (see CLAUDE.md).
--     The only policies here are on storage.objects, which Supabase keeps
--     RLS-enabled — without them photo uploads are rejected.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 0. Remove the starter's example table
-- ───────────────────────────────────────────────────────────────────────────
drop table if exists public.items cascade;


-- ───────────────────────────────────────────────────────────────────────────
-- 1. Shared helpers
-- ───────────────────────────────────────────────────────────────────────────
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
-- 2. profiles — one row per auth user, created automatically on sign-up
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default '' check (char_length(full_name) <= 120),
  role        text        not null default 'student'
                check (role in ('student', 'teacher', 'lab_assistant', 'maintenance', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Self sign-up may only choose student or teacher. Staff roles are granted by
-- an admin (or the seed script) by updating profiles.role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when requested_role in ('student', 'teacher') then requested_role else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────────────
-- 3. locations — every room / lab gets a QR code that encodes its `code`
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  code        text        not null unique check (code ~ '^[A-Z0-9-]{2,32}$'),
  name        text        not null check (char_length(name) between 2 and 120),
  building    text        not null default '' check (char_length(building) <= 120),
  floor       text        not null default '' check (char_length(floor) <= 20),
  type        text        not null default 'classroom'
                check (type in ('classroom', 'laboratory', 'office', 'library', 'common_area')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();


-- ───────────────────────────────────────────────────────────────────────────
-- 4. tickets — one reported issue
-- ───────────────────────────────────────────────────────────────────────────
create sequence if not exists public.ticket_number_seq start 1001;

create table if not exists public.tickets (
  id             uuid primary key default gen_random_uuid(),
  ticket_number  text        not null unique
                   default ('CF-' || lpad(nextval('public.ticket_number_seq')::text, 6, '0')),
  location_id    uuid        not null
                   constraint tickets_location_id_fkey references public.locations (id) on delete restrict,
  reporter_id    uuid        not null
                   constraint tickets_reporter_id_fkey references public.profiles (id) on delete cascade,
  assigned_to    uuid
                   constraint tickets_assigned_to_fkey references public.profiles (id) on delete set null,
  category       text        not null
                   check (category in ('computer_equipment', 'projector_av', 'furniture', 'electrical',
                                       'network_internet', 'plumbing', 'air_conditioning', 'other')),
  severity       text        not null default 'medium'
                   check (severity in ('low', 'medium', 'high', 'critical')),
  status         text        not null default 'pending'
                   check (status in ('pending', 'in_progress', 'resolved')),
  title          text        not null check (char_length(title) between 3 and 120),
  description    text        not null default '' check (char_length(description) <= 2000),
  asset_label    text        not null default '' check (char_length(asset_label) <= 80),
  photo_urls     text[]      not null default '{}' check (cardinality(photo_urls) <= 3),
  ai_summary     text,
  ai_category    text,
  ai_severity    text,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tickets_status_idx      on public.tickets (status);
create index if not exists tickets_location_idx    on public.tickets (location_id);
create index if not exists tickets_reporter_idx    on public.tickets (reporter_id);
create index if not exists tickets_created_at_idx  on public.tickets (created_at desc);

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Keep resolved_at in sync with status.
create or replace function public.tickets_sync_resolved_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and (tg_op = 'INSERT' or old.status is distinct from 'resolved') then
    new.resolved_at = coalesce(new.resolved_at, now());
  elsif new.status <> 'resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_sync_resolved_at on public.tickets;
create trigger tickets_sync_resolved_at
  before insert or update of status on public.tickets
  for each row execute function public.tickets_sync_resolved_at();


-- ───────────────────────────────────────────────────────────────────────────
-- 5. ticket_updates — the status timeline shown on the ticket page
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.ticket_updates (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid        not null
                 constraint ticket_updates_ticket_id_fkey references public.tickets (id) on delete cascade,
  author_id    uuid
                 constraint ticket_updates_author_id_fkey references public.profiles (id) on delete set null,
  from_status  text,
  to_status    text        not null check (to_status in ('pending', 'in_progress', 'resolved')),
  note         text        not null default '' check (char_length(note) <= 1000),
  created_at   timestamptz not null default now()
);

create index if not exists ticket_updates_ticket_idx on public.ticket_updates (ticket_id, created_at);

-- First timeline entry ("Reported") is written automatically on ticket insert.
create or replace function public.tickets_log_created()
returns trigger
language plpgsql
as $$
begin
  insert into public.ticket_updates (ticket_id, author_id, from_status, to_status, note, created_at)
  values (new.id, new.reporter_id, null, new.status, 'Issue reported', new.created_at);
  return new;
end;
$$;

drop trigger if exists tickets_log_created on public.tickets;
create trigger tickets_log_created
  after insert on public.tickets
  for each row execute function public.tickets_log_created();

-- Atomic "change status + leave a note" used by staff from the ticket page.
create or replace function public.update_ticket_status(
  p_ticket_id uuid,
  p_status    text,
  p_note      text default ''
)
returns public.tickets
language plpgsql
as $$
declare
  previous text;
  result   public.tickets;
begin
  select status into previous from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket not found' using errcode = 'P0002';
  end if;

  update public.tickets set status = p_status where id = p_ticket_id returning * into result;

  insert into public.ticket_updates (ticket_id, author_id, from_status, to_status, note)
  values (p_ticket_id, auth.uid(), previous, p_status, coalesce(p_note, ''));

  return result;
end;
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- 6. Analytics views
-- ───────────────────────────────────────────────────────────────────────────
create or replace view public.ticket_stats_by_category as
select
  category,
  count(*)::int                                          as total,
  count(*) filter (where status <> 'resolved')::int      as open
from public.tickets
group by category
order by total desc;

create or replace view public.ticket_stats_by_location as
select
  l.id   as location_id,
  l.code,
  l.name,
  count(t.id)::int                                         as total,
  count(t.id) filter (where t.status <> 'resolved')::int   as open
from public.locations l
left join public.tickets t on t.location_id = l.id
group by l.id, l.code, l.name
order by total desc;

create or replace view public.ticket_daily_counts as
select
  d::date                                                       as day,
  count(t.id)::int                                              as reported,
  (select count(*)::int from public.tickets r
     where r.resolved_at >= d and r.resolved_at < d + interval '1 day') as resolved
from generate_series(current_date - interval '29 days', current_date, interval '1 day') as d
left join public.tickets t on t.created_at >= d and t.created_at < d + interval '1 day'
group by d
order by d;

create or replace view public.ticket_overview as
select
  count(*) filter (where status = 'pending')::int                                       as pending,
  count(*) filter (where status = 'in_progress')::int                                   as in_progress,
  count(*) filter (where status = 'resolved')::int                                      as resolved,
  count(*) filter (where status = 'resolved' and resolved_at >= now() - interval '7 days')::int
                                                                                        as resolved_this_week,
  count(*) filter (where severity = 'critical' and status <> 'resolved')::int           as open_critical,
  round(avg(extract(epoch from (resolved_at - created_at)) / 3600.0)
          filter (where resolved_at is not null)::numeric, 1)                           as avg_resolution_hours
from public.tickets;


-- ───────────────────────────────────────────────────────────────────────────
-- 7. Prototyping mode: RLS off on our tables (see CLAUDE.md)
-- ───────────────────────────────────────────────────────────────────────────
alter table public.profiles       disable row level security;
alter table public.locations      disable row level security;
alter table public.tickets        disable row level security;
alter table public.ticket_updates disable row level security;


-- ───────────────────────────────────────────────────────────────────────────
-- 8. Realtime — live status updates and new-ticket toasts
-- ───────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'tickets') then
    alter publication supabase_realtime add table public.tickets;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'ticket_updates') then
    alter publication supabase_realtime add table public.ticket_updates;
  end if;
end;
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- 9. Storage — public bucket for issue photos
-- ───────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-photos', 'ticket-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ticket-photos: signed-in upload" on storage.objects;
create policy "ticket-photos: signed-in upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ticket-photos');

drop policy if exists "ticket-photos: public read" on storage.objects;
create policy "ticket-photos: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'ticket-photos');
