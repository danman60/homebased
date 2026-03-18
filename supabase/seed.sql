-- Seed data for development and testing
-- Creates a sample family with realistic data

-- Insert sample family
INSERT INTO families (id, timezone) VALUES 
    ('f1234567-89ab-cdef-0123-456789abcdef', 'America/New_York');

-- Insert sample parents
INSERT INTO users (id, family_id, email, role, name) VALUES 
    ('u1111111-1111-1111-1111-111111111111', 'f1234567-89ab-cdef-0123-456789abcdef', 'parent.a@example.com', 'parent_a', 'Alex'),
    ('u2222222-2222-2222-2222-222222222222', 'f1234567-89ab-cdef-0123-456789abcdef', 'parent.b@example.com', 'parent_b', 'Jordan');

-- Insert sample children
INSERT INTO children (id, family_id, name, color, icon) VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'f1234567-89ab-cdef-0123-456789abcdef', 'Emma', '#ff6b6b', 'star'),
    ('c2222222-2222-2222-2222-222222222222', 'f1234567-89ab-cdef-0123-456789abcdef', 'Liam', '#4ecdc4', 'heart');

-- Insert sample cyclical tasks
INSERT INTO tasks (id, family_id, title, notes, recurrence_rule, assignee_user_id, type) VALUES 
    ('t1111111-1111-1111-1111-111111111111', 'f1234567-89ab-cdef-0123-456789abcdef', 'School pickup - Emma', 'Pick up from Pine Elementary at 3:15 PM', 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'u1111111-1111-1111-1111-111111111111', 'cyclical'),
    ('t2222222-2222-2222-2222-222222222222', 'f1234567-89ab-cdef-0123-456789abcdef', 'Dinner duty', 'Prepare and serve dinner for family', 'FREQ=WEEKLY;BYDAY=MO,WE,FR', 'u2222222-2222-2222-2222-222222222222', 'cyclical'),
    ('t3333333-3333-3333-3333-333333333333', 'f1234567-89ab-cdef-0123-456789abcdef', 'Soccer practice - Liam', 'Drop off at Riverside Park', 'FREQ=WEEKLY;BYDAY=SA', 'u1111111-1111-1111-1111-111111111111', 'cyclical');

-- Insert sample project tasks
INSERT INTO tasks (id, family_id, title, notes, due_date, assignee_user_id, type) VALUES 
    ('t4444444-4444-4444-4444-444444444444', 'f1234567-89ab-cdef-0123-456789abcdef', 'Plan Emma''s birthday party', 'Book venue, send invitations, order cake', '2024-03-15 12:00:00+00', 'u1111111-1111-1111-1111-111111111111', 'project'),
    ('t5555555-5555-5555-5555-555555555555', 'f1234567-89ab-cdef-0123-456789abcdef', 'Organize garage', 'Sort through storage boxes and donate unused items', '2024-03-20 18:00:00+00', 'u2222222-2222-2222-2222-222222222222', 'project');

-- Insert sample availability blocks for current week
INSERT INTO availability_blocks (id, user_id, start_time, end_time, type, is_recurring, recurrence_pattern) VALUES 
    -- Alex's work blocks (Parent A)
    ('a1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', '2024-03-11 09:00:00+00', '2024-03-11 17:00:00+00', 'work', true, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'),
    ('a2222222-2222-2222-2222-222222222222', 'u1111111-1111-1111-1111-111111111111', '2024-03-11 17:00:00+00', '2024-03-11 19:00:00+00', 'childcare', true, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'),
    
    -- Jordan's work blocks (Parent B)
    ('a3333333-3333-3333-3333-333333333333', 'u2222222-2222-2222-2222-222222222222', '2024-03-11 10:00:00+00', '2024-03-11 14:00:00+00', 'work', true, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'),
    ('a4444444-4444-4444-4444-444444444444', 'u2222222-2222-2222-2222-222222222222', '2024-03-11 07:00:00+00', '2024-03-11 09:00:00+00', 'childcare', true, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');

-- Insert sample weekly totals for tracking
INSERT INTO weekly_totals (id, user_id, week_start, work_minutes, childcare_minutes) VALUES 
    ('w1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', '2024-03-11', 2400, 600), -- 40 hours work, 10 hours childcare
    ('w2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', '2024-03-11', 1200, 840); -- 20 hours work, 14 hours childcare

-- Insert sample integration account
INSERT INTO integration_accounts (id, family_id, provider, account_email, calendars) VALUES 
    ('i1111111-1111-1111-1111-111111111111', 'f1234567-89ab-cdef-0123-456789abcdef', 'google_calendar', 'parent.a@example.com', 
     '[{"calendar_id": "primary", "calendar_name": "Alex Personal", "is_primary": true, "is_selected_for_homebase": true}, 
       {"calendar_id": "family@example.com", "calendar_name": "Family Calendar", "is_primary": false, "is_selected_for_homebase": true}]');

-- Insert sample event mappings
INSERT INTO homebase_event_map (id, task_id, google_event_id, calendar_id) VALUES 
    ('m1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'google_event_123', 'primary'),
    ('m2222222-2222-2222-2222-222222222222', 't4444444-4444-4444-4444-444444444444', 'google_event_456', 'family@example.com');