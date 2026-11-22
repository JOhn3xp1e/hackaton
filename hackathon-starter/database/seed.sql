-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — demo rows for development and the final presentation.
-- Run AFTER schema.sql. Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.
-- To reset:  truncate table public.items restart identity cascade;  then re-run.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.items (id, title, description, status, priority, category, created_at, updated_at)
values
  ('6f1c2b1e-0000-4000-8000-000000000001', 'Set up project repository', 'Monorepo with client, server and database folders.', 'done',        'high',   'Setup',    now() - interval '30 hours', now() - interval '28 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000002', 'Design database schema',    'Tables, relations and RLS policies.',                'done',        'high',   'Database', now() - interval '26 hours', now() - interval '20 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000003', 'Implement REST endpoints',  'CRUD for the core resource.',                        'in_progress', 'high',   'Backend',  now() - interval '22 hours', now() - interval '2 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000004', 'Build dashboard overview',  'Stat cards, chart and activity table.',              'in_progress', 'medium', 'Frontend', now() - interval '20 hours', now() - interval '1 hour'),
  ('6f1c2b1e-0000-4000-8000-000000000005', 'Write API contract',        'Agree request/response shapes as a team.',           'done',        'medium', 'Docs',     now() - interval '19 hours', now() - interval '18 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000006', 'Seed demo data',            'Realistic records for the final demo.',              'todo',        'medium', 'Database', now() - interval '16 hours', now() - interval '16 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000007', 'Form validation',           'Client + server validation with matching messages.', 'todo',        'low',    'Frontend', now() - interval '14 hours', now() - interval '14 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000008', 'Error handling middleware', 'Consistent JSON error responses.',                   'done',        'medium', 'Backend',  now() - interval '12 hours', now() - interval '10 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000009', 'Responsive layout QA',      'Check mobile, tablet and desktop.',                  'todo',        'low',    'Frontend', now() - interval '10 hours', now() - interval '10 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000010', 'Prepare demo script',       '3-minute walkthrough of the core flow.',             'todo',        'high',   'Docs',     now() - interval '8 hours',  now() - interval '8 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000011', 'Postman collection',        'Shareable requests for every endpoint.',             'in_progress', 'low',    'Backend',  now() - interval '6 hours',  now() - interval '3 hours'),
  ('6f1c2b1e-0000-4000-8000-000000000012', 'Old prototype notes',       'Kept for reference.',                                'archived',    'low',    'Docs',     now() - interval '48 hours', now() - interval '40 hours')
on conflict (id) do nothing;

-- Sanity check
select status, count(*) from public.items group by status order by status;
