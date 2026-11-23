-- ═══════════════════════════════════════════════════════════════════════════
-- CAMPUSFIX — SEED DATA (locations & equipment)
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


-- ═══════════════════════════════════════════════════════════════════════════
-- EQUIPMENT — demo items with sticker IDs (Students report by Equipment ID)
-- Idempotent: ON CONFLICT (short_code) DO NOTHING. Items whose location code
-- is missing are skipped by the join.
-- ═══════════════════════════════════════════════════════════════════════════
insert into public.equipment (short_code, name, description, location_id)
select e.short_code, e.name, e.description, l.id
from (
  -- Computer Laboratory 1: 10 PCs + aircon + projector
  select 'CL1-PC' || lpad(n::text, 2, '0') as short_code, 'Computer ' || n as name,
         'Desktop PC, row ' || ((n - 1) / 5 + 1) || ', seat ' || ((n - 1) % 5 + 1) as description, 'CL-LAB-1' as loc
  from generate_series(1, 10) as n
  union all
  -- Computer Laboratory 2: 15 PCs
  select 'CL2-PC' || lpad(n::text, 2, '0'), 'Computer ' || n,
         'Desktop PC, row ' || ((n - 1) / 5 + 1) || ', seat ' || ((n - 1) % 5 + 1), 'CL-LAB-2'
  from generate_series(1, 15) as n
  union all
  select * from (values
    ('CL1-AC1',          'Aircon unit 1',            'Split-type aircon above the entrance',           'CL-LAB-1'),
    ('CL1-PROJ',         'Ceiling projector',        'Ceiling-mounted projector with HDMI wall plate',  'CL-LAB-1'),
    ('CL2-AC1',          'Aircon unit 1',            'Split-type aircon, front of the lab',            'CL-LAB-2'),
    ('CL2-AC2',          'Aircon unit 2',            'Split-type aircon, back of the lab',             'CL-LAB-2'),
    ('CL2-PROJ',         'Ceiling projector',        'Ceiling-mounted projector with HDMI wall plate',  'CL-LAB-2'),
    ('CL2-PRINT',        'Shared printer',           'Laser printer beside the instructor table',      'CL-LAB-2'),
    ('CL2-SWITCH',       'Network switch',           '24-port switch in the wall cabinet',             'CL-LAB-2'),
    ('CHEM-SINK1',       'Lab sink 1',               'Front sink with eyewash station',                'CHEM-LAB'),
    ('CHEM-SINK2',       'Lab sink 2',               'Back sink near the fume hood',                   'CHEM-LAB'),
    ('CHEM-HOOD',        'Fume hood',                'Ventilated fume hood',                           'CHEM-LAB'),
    ('PHYS-OUTLET1',     'Outlet beside teacher table', 'Double socket at the teacher table',         'PHYS-LAB'),
    ('PHYS-LIGHTS',      'Ceiling lights',           'Fluorescent ceiling lights',                     'PHYS-LAB'),
    ('RM101-PROJ',       'Ceiling projector',        'Ceiling-mounted projector',                      'RM-101'),
    ('RM101-WB',         'Front whiteboard',         'Large whiteboard at the front',                  'RM-101'),
    ('RM204-PROJ',       'Ceiling projector',        'Ceiling-mounted projector',                      'RM-204'),
    ('RM204-AC1',        'Aircon unit 1',            'Window-type aircon',                             'RM-204'),
    ('RM305-PROJ',       'Ceiling projector',        'Ceiling-mounted projector',                      'RM-305'),
    ('RM305-DOOR',       'Main door',                'Front door with lock',                           'RM-305'),
    ('AVR-PROJ',         'Main projector',           'High-lumen projector and motorized screen',      'AVR-1'),
    ('AVR-SPK',          'Wall speakers',            'Stereo wall speakers and amplifier',             'AVR-1'),
    ('AVR-MIC',          'Wireless microphone',      'Handheld wireless mic set',                      'AVR-1'),
    ('LIB-AC1',          'Aircon unit 1',            'Ceiling-cassette aircon, reading area',          'LIB-MAIN'),
    ('LIB-WIFI',         'Library Wi-Fi access point', 'Ceiling access point, reading area',          'LIB-MAIN'),
    ('LIB-PC01',         'Catalog computer',         'Library catalog kiosk',                          'LIB-MAIN'),
    ('REG-PRINT',        'Office printer',           'Shared printer at the registrar counter',        'REG-OFC'),
    ('REG-AC1',          'Aircon unit 1',            'Split-type aircon',                              'REG-OFC'),
    ('CANTEEN-FOUNTAIN', 'Drinking fountain',        'Water fountain near the entrance',               'CANTEEN'),
    ('CANTEEN-SINK',     'Hand-wash sink',           'Sink row beside the counter',                    'CANTEEN'),
    ('GYM-LIGHTS',       'Court lights',             'High-bay lights over the court',                 'GYM'),
    ('GYM-FOUNTAIN',     'Drinking fountain',        'Water fountain beside the bleachers',            'GYM')
  ) as v(short_code, name, description, loc)
) as e
join public.locations l on l.code = e.loc
on conflict (short_code) do nothing;
