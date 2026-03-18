-- Row Level Security Policies for Homebase
-- All tables use hb_ prefix

-- Enable RLS on all tables
ALTER TABLE hb_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_weekly_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_integration_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hb_event_map ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's family_id
CREATE OR REPLACE FUNCTION hb_get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM hb_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Families: users can view their own family
CREATE POLICY "hb: Users can view their family" ON hb_families
  FOR SELECT USING (id = hb_get_user_family_id());

CREATE POLICY "hb: Users can update their family" ON hb_families
  FOR UPDATE USING (id = hb_get_user_family_id());

-- Users: can view family members, update own profile
CREATE POLICY "hb: Users can view family members" ON hb_users
  FOR SELECT USING (family_id = hb_get_user_family_id());

CREATE POLICY "hb: Users can update own profile" ON hb_users
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "hb: Users can insert during onboarding" ON hb_users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Children: family members can manage children
CREATE POLICY "hb: Family can view children" ON hb_children
  FOR SELECT USING (family_id = hb_get_user_family_id());

CREATE POLICY "hb: Family can manage children" ON hb_children
  FOR ALL USING (family_id = hb_get_user_family_id());

-- Tasks: family members can manage tasks
CREATE POLICY "hb: Family can view tasks" ON hb_tasks
  FOR SELECT USING (family_id = hb_get_user_family_id());

CREATE POLICY "hb: Family can manage tasks" ON hb_tasks
  FOR ALL USING (family_id = hb_get_user_family_id());

-- Projects: family members can manage projects
CREATE POLICY "hb: Family can view projects" ON hb_projects
  FOR SELECT USING (family_id = hb_get_user_family_id());

CREATE POLICY "hb: Family can manage projects" ON hb_projects
  FOR ALL USING (family_id = hb_get_user_family_id());

-- Availability blocks: view all family, manage own
CREATE POLICY "hb: Family can view availability" ON hb_availability_blocks
  FOR SELECT USING (
    user_id IN (SELECT id FROM hb_users WHERE family_id = hb_get_user_family_id())
  );

CREATE POLICY "hb: Users can manage own availability" ON hb_availability_blocks
  FOR ALL USING (
    user_id = (SELECT id FROM hb_users WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Weekly totals: view family, manage own
CREATE POLICY "hb: Family can view weekly totals" ON hb_weekly_totals
  FOR SELECT USING (
    user_id IN (SELECT id FROM hb_users WHERE family_id = hb_get_user_family_id())
  );

CREATE POLICY "hb: Users can manage own totals" ON hb_weekly_totals
  FOR ALL USING (
    user_id = (SELECT id FROM hb_users WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Integration accounts: family can manage
CREATE POLICY "hb: Family can view integrations" ON hb_integration_accounts
  FOR SELECT USING (family_id = hb_get_user_family_id());

CREATE POLICY "hb: Family can manage integrations" ON hb_integration_accounts
  FOR ALL USING (family_id = hb_get_user_family_id());

-- Event map: family can manage via task ownership
CREATE POLICY "hb: Family can view event mappings" ON hb_event_map
  FOR SELECT USING (
    task_id IN (SELECT id FROM hb_tasks WHERE family_id = hb_get_user_family_id())
  );

CREATE POLICY "hb: Family can manage event mappings" ON hb_event_map
  FOR ALL USING (
    task_id IN (SELECT id FROM hb_tasks WHERE family_id = hb_get_user_family_id())
  );
