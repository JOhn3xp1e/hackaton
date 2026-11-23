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


-- Equipment — each item gets its own QR sticker (/e/<short_code>).
-- Idempotent: ON CONFLICT (short_code) DO NOTHING.
insert into public.equipment (short_code, name, description, location_id)
select e.short_code, e.name, e.description, l.id
from (
  values
    -- Computer Laboratory 1: 20 workstations + shared gear
    ('CL1-PC-01', 'Computer 01', 'Desktop workstation, row 1',  'CL-LAB-1'),
    ('CL1-PC-02', 'Computer 02', 'Desktop workstation, row 1',  'CL-LAB-1'),
    ('CL1-PC-03', 'Computer 03', 'Desktop workstation, row 1',  'CL-LAB-1'),
    ('CL1-PC-04', 'Computer 04', 'Desktop workstation, row 1',  'CL-LAB-1'),
    ('CL1-PC-05', 'Computer 05', 'Desktop workstation, row 1',  'CL-LAB-1'),
    ('CL1-PC-06', 'Computer 06', 'Desktop workstation, row 2',  'CL-LAB-1'),
    ('CL1-PC-07', 'Computer 07', 'Desktop workstation, row 2',  'CL-LAB-1'),
    ('CL1-PC-08', 'Computer 08', 'Desktop workstation, row 2',  'CL-LAB-1'),
    ('CL1-PC-09', 'Computer 09', 'Desktop workstation, row 2',  'CL-LAB-1'),
    ('CL1-PC-10', 'Computer 10', 'Desktop workstation, row 2',  'CL-LAB-1'),
    ('CL1-PC-11', 'Computer 11', 'Desktop workstation, row 3',  'CL-LAB-1'),
    ('CL1-PC-12', 'Computer 12', 'Desktop workstation, row 3',  'CL-LAB-1'),
    ('CL1-PC-13', 'Computer 13', 'Desktop workstation, row 3',  'CL-LAB-1'),
    ('CL1-PC-14', 'Computer 14', 'Desktop workstation, row 3',  'CL-LAB-1'),
    ('CL1-PC-15', 'Computer 15', 'Desktop workstation, row 3',  'CL-LAB-1'),
    ('CL1-PC-16', 'Computer 16', 'Desktop workstation, row 4',  'CL-LAB-1'),
    ('CL1-PC-17', 'Computer 17', 'Desktop workstation, row 4',  'CL-LAB-1'),
    ('CL1-PC-18', 'Computer 18', 'Desktop workstation, row 4',  'CL-LAB-1'),
    ('CL1-PC-19', 'Computer 19', 'Desktop workstation, row 4',  'CL-LAB-1'),
    ('CL1-PC-20', 'Computer 20', 'Desktop workstation, row 4',  'CL-LAB-1'),
    ('CL1-PROJ',  'Ceiling projector', 'Front of the room',      'CL-LAB-1'),
    ('CL1-AC-1',  'Aircon unit 1', 'Window-type, left wall',     'CL-LAB-1'),
    ('CL1-PRN',   'Network printer', 'Beside the instructor desk', 'CL-LAB-1'),
    -- Computer Laboratory 2
    ('CL2-PC-01', 'Computer 01', 'Desktop workstation, row 1',  'CL-LAB-2'),
    ('CL2-PC-02', 'Computer 02', 'Desktop workstation, row 1',  'CL-LAB-2'),
    ('CL2-PC-03', 'Computer 03', 'Desktop workstation, row 1',  'CL-LAB-2'),
    ('CL2-PC-04', 'Computer 04', 'Desktop workstation, row 2',  'CL-LAB-2'),
    ('CL2-PC-05', 'Computer 05', 'Desktop workstation, row 2',  'CL-LAB-2'),
    ('CL2-PROJ',  'Ceiling projector', 'Front of the room',      'CL-LAB-2'),
    ('CL2-AP',    'Wi-Fi access point', 'Ceiling, center',       'CL-LAB-2'),
    -- Classrooms & shared spaces
    ('RM101-PROJ', 'Ceiling projector', 'Front of the room',     'RM-101'),
    ('RM101-AC-1', 'Aircon unit 1', 'Split-type, back wall',     'RM-101'),
    ('RM204-PROJ', 'Ceiling projector', 'Front of the room',     'RM-204'),
    ('RM204-AC-1', 'Aircon unit 1', 'Split-type, back wall',     'RM-204'),
    ('RM305-TV',   'Smart TV', 'Wall-mounted, front',            'RM-305'),
    ('AVR-PROJ',   'Main projector', 'Ceiling, center',          'AVR-1'),
    ('AVR-SPK',    'Speaker system', 'Left and right of screen', 'AVR-1'),
    ('AVR-MIC',    'Wireless microphone set', 'Stored at the podium', 'AVR-1'),
    ('LIB-PC-01',  'Catalog kiosk 1', 'Near the entrance',       'LIB-MAIN'),
    ('LIB-PC-02',  'Catalog kiosk 2', 'Reference section',       'LIB-MAIN'),
    ('CHEM-HOOD-1', 'Fume hood 1', 'Back wall',                  'CHEM-LAB'),
    ('PHYS-OSC-1', 'Oscilloscope 1', 'Bench 1',                  'PHYS-LAB')
) as e (short_code, name, description, location_code)
join public.locations l on l.code = e.location_code
on conflict (short_code) do nothing;
