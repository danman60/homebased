-- Row Level Security (RLS) Policies
-- Ensures families can only access their own data

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE homebase_event_map ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's family_id
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT family_id FROM users WHERE id = auth.uid();
$$;

-- Families policies
CREATE POLICY "Users can view their own family" ON families
    FOR SELECT USING (id = get_user_family_id());

CREATE POLICY "Users can update their own family" ON families
    FOR UPDATE USING (id = get_user_family_id());

-- Users policies
CREATE POLICY "Users can view family members" ON users
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Children policies
CREATE POLICY "Users can manage family children" ON children
    FOR ALL USING (family_id = get_user_family_id());

-- Tasks policies
CREATE POLICY "Users can manage family tasks" ON tasks
    FOR ALL USING (family_id = get_user_family_id());

-- Projects policies
CREATE POLICY "Users can manage family projects" ON projects
    FOR ALL USING (family_id = get_user_family_id());

-- Availability blocks policies
CREATE POLICY "Users can view all family availability" ON availability_blocks
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE family_id = get_user_family_id()
    ));

CREATE POLICY "Users can manage their own availability" ON availability_blocks
    FOR ALL USING (user_id = auth.uid());

-- Weekly totals policies
CREATE POLICY "Users can view all family totals" ON weekly_totals
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE family_id = get_user_family_id()
    ));

CREATE POLICY "System can manage weekly totals" ON weekly_totals
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE family_id = get_user_family_id()
    ));

-- Integration accounts policies
CREATE POLICY "Users can manage family integrations" ON integration_accounts
    FOR ALL USING (family_id = get_user_family_id());

-- Event mapping policies
CREATE POLICY "Users can view family event mappings" ON homebase_event_map
    FOR SELECT USING (task_id IN (
        SELECT id FROM tasks WHERE family_id = get_user_family_id()
    ));

CREATE POLICY "System can manage event mappings" ON homebase_event_map
    FOR ALL USING (task_id IN (
        SELECT id FROM tasks WHERE family_id = get_user_family_id()
    ));