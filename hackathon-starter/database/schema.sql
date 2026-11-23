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

-- Creates the profile on sign-up. Admin / maintenance / lab_assistant roles
-- are granted by an admin (or the seed script) by updating profiles.role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Students report without an account (student number only), so every
  -- self sign-up is a teacher (= staff). Other staff roles are set by an admin.
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'teacher'
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
-- 3b. equipment — individual items (PCs, projectors, aircon…) with a short ID
--     printed on a sticker. Students report by Equipment ID; the equipment
--     carries its location, so the room never has to be picked separately.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.equipment (
  id           uuid primary key default gen_random_uuid(),
  short_code   text        not null
                 constraint equipment_short_code_key unique
                 constraint equipment_short_code_check check (short_code ~ '^[A-Z0-9-]{2,32}$'),
  name         text        not null
                 constraint equipment_name_check check (char_length(name) between 2 and 120),
  description  text        not null default ''
                 constraint equipment_description_check check (char_length(description) <= 500),
  location_id  uuid        not null
                 constraint equipment_location_id_fkey references public.locations (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists equipment_location_idx on public.equipment (location_id);

drop trigger if exists equipment_set_updated_at on public.equipment;
create trigger equipment_set_updated_at
  before update on public.equipment
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
  reporter_id    uuid
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

-- v2: students report without an account (student number + optional name),
-- and staff review each report as valid/invalid to award credits.
alter table public.tickets alter column reporter_id drop not null;
alter table public.tickets add column if not exists student_no    text;
alter table public.tickets add column if not exists reporter_name text not null default '';
alter table public.tickets add column if not exists is_anonymous  boolean not null default false;
alter table public.tickets add column if not exists validity      text not null default 'unreviewed';
alter table public.tickets add column if not exists validated_by  uuid
  constraint tickets_validated_by_fkey references public.profiles (id) on delete set null;
alter table public.tickets add column if not exists validated_at  timestamptz;

alter table public.tickets drop constraint if exists tickets_student_no_format;
alter table public.tickets add constraint tickets_student_no_format
  check (student_no is null or student_no ~ '^[A-Za-z0-9-]{4,20}$');
alter table public.tickets drop constraint if exists tickets_reporter_name_length;
alter table public.tickets add constraint tickets_reporter_name_length check (char_length(reporter_name) <= 80);
alter table public.tickets drop constraint if exists tickets_validity_check;
alter table public.tickets add constraint tickets_validity_check check (validity in ('unreviewed', 'valid', 'invalid'));
alter table public.tickets drop constraint if exists tickets_reporter_present;
alter table public.tickets add constraint tickets_reporter_present check (reporter_id is not null or student_no is not null);

-- v3: the specific piece of equipment that is broken (optional for old tickets).
alter table public.tickets add column if not exists equipment_id uuid
  constraint tickets_equipment_id_fkey references public.equipment (id) on delete set null;
create index if not exists tickets_equipment_idx   on public.tickets (equipment_id);

create index if not exists tickets_student_no_idx  on public.tickets (student_no);
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
-- 5b. ticket_comments — public discussion on a report
--     Staff comment as their profile (author_id); students with their number.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.ticket_comments (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid        not null
                  constraint ticket_comments_ticket_id_fkey references public.tickets (id) on delete cascade,
  author_id     uuid
                  constraint ticket_comments_author_id_fkey references public.profiles (id) on delete set null,
  student_no    text        check (student_no is null or student_no ~ '^[A-Za-z0-9-]{4,20}$'),
  display_name  text        not null default '' check (char_length(display_name) <= 80),
  is_anonymous  boolean     not null default false,
  body          text        not null check (char_length(trim(body)) between 1 and 1000),
  created_at    timestamptz not null default now(),
  constraint ticket_comments_author_present check (author_id is not null or student_no is not null)
);

create index if not exists ticket_comments_ticket_idx on public.ticket_comments (ticket_id, created_at);


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
          filter (where resolved_at is not null)::numeric, 1)                           as avg_resolution_hours,
  count(*) filter (where validity = 'unreviewed' and student_no is not null)::int       as unreviewed
from public.tickets;

-- Credits: +10 for a report staff marked valid, +5 more once it is resolved.
-- Keep in sync with CREDITS in client/src/lib/constants.js.
create or replace view public.student_credits as
select
  student_no,
  (array_agg(nullif(reporter_name, '') order by created_at desc)
     filter (where not is_anonymous and reporter_name <> ''))[1]                       as display_name,
  count(*)::int                                                                         as reports,
  count(*) filter (where validity = 'valid')::int                                       as valid_reports,
  coalesce(sum(case when validity = 'valid'
                    then 10 + (case when status = 'resolved' then 5 else 0 end)
                    else 0 end), 0)::int                                                as credits,
  max(created_at)                                                                       as last_report_at
from public.tickets
where student_no is not null
group by student_no
order by credits desc, valid_reports desc, last_report_at desc;


-- ───────────────────────────────────────────────────────────────────────────
-- 7. Prototyping mode: RLS off on our tables (see CLAUDE.md)
-- ───────────────────────────────────────────────────────────────────────────
alter table public.profiles       disable row level security;
alter table public.locations      disable row level security;
alter table public.equipment      disable row level security;
alter table public.tickets        disable row level security;
alter table public.ticket_updates disable row level security;
alter table public.ticket_comments disable row level security;


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
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'ticket_comments') then
    alter publication supabase_realtime add table public.ticket_comments;
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

-- Students report without signing in, so anon may upload too (photos only,
-- size/type limited by the bucket settings above).
drop policy if exists "ticket-photos: signed-in upload" on storage.objects;
drop policy if exists "ticket-photos: upload" on storage.objects;
create policy "ticket-photos: upload"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'ticket-photos');

drop policy if exists "ticket-photos: public read" on storage.objects;
create policy "ticket-photos: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'ticket-photos');
