-- ═══════════════════════════════════════════════════════════════════════════
-- CAMPUSFIX — SEED DATA (locations)
-- Run AFTER schema.sql. Idempotent: ON CONFLICT (code) DO NOTHING.
--
-- Demo users and historical tickets need real auth accounts, so they are
-- created by the server script instead:   npm run seed:demo --prefix server
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.locations (code, name, building, floor, type)
values
  ('CL-LAB-1',  'Computer Laboratory 1',        'Science & Technology Building', '2F', 'laboratory'),
  ('CL-LAB-2',  'Computer Laboratory 2',        'Science & Technology Building', '2F', 'laboratory'),
  ('CHEM-LAB',  'Chemistry Laboratory',         'Science & Technology Building', '3F', 'laboratory'),
  ('PHYS-LAB',  'Physics Laboratory',           'Science & Technology Building', '3F', 'laboratory'),
  ('RM-101',    'Room 101',                     'Main Academic Building',        '1F', 'classroom'),
  ('RM-204',    'Room 204',                     'Main Academic Building',        '2F', 'classroom'),
  ('RM-305',    'Room 305',                     'Main Academic Building',        '3F', 'classroom'),
  ('AVR-1',     'Audio-Visual Room',            'Main Academic Building',        '1F', 'classroom'),
  ('LIB-MAIN',  'Main Library',                 'Library Building',              '1F', 'library'),
  ('REG-OFC',   'Registrar''s Office',          'Administration Building',       '1F', 'office'),
  ('CANTEEN',   'Student Canteen',              'Student Center',                'GF', 'common_area'),
  ('GYM',       'Gymnasium',                    'Sports Complex',                'GF', 'common_area')
on conflict (code) do nothing;
