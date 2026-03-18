-- Homebase Initial Schema Migration
-- All tables prefixed with hb_ to avoid conflicts on shared Supabase (CC&SS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table
CREATE TABLE hb_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (parents) - links to auth.users via id
CREATE TABLE hb_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES hb_families(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent_a', 'parent_b')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children table
CREATE TABLE hb_children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES hb_families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50) NOT NULL DEFAULT 'child',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (unified cyclical and project tasks)
CREATE TABLE hb_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES hb_families(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    recurrence_rule VARCHAR(500),
    assignee_user_id UUID REFERENCES hb_users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cyclical', 'project')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (for additional project metadata)
CREATE TABLE hb_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES hb_families(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability blocks for parent scheduling
CREATE TABLE hb_availability_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES hb_users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('work', 'childcare', 'personal')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly totals for work/childcare tracking
CREATE TABLE hb_weekly_totals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES hb_users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    work_minutes INTEGER NOT NULL DEFAULT 0,
    childcare_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Integration accounts (Google Calendar, etc.)
CREATE TABLE hb_integration_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES hb_families(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google_calendar', 'google_maps')),
    account_email VARCHAR(255) NOT NULL,
    calendars JSONB,
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, provider, account_email)
);

-- Homebase event mapping for Google Calendar sync
CREATE TABLE hb_event_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES hb_tasks(id) ON DELETE CASCADE,
    google_event_id VARCHAR(200) NOT NULL,
    calendar_id VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, google_event_id)
);

-- Indexes for performance
CREATE INDEX idx_hb_users_family_id ON hb_users(family_id);
CREATE INDEX idx_hb_users_auth_user_id ON hb_users(auth_user_id);
CREATE INDEX idx_hb_children_family_id ON hb_children(family_id);
CREATE INDEX idx_hb_tasks_family_id ON hb_tasks(family_id);
CREATE INDEX idx_hb_tasks_assignee ON hb_tasks(assignee_user_id);
CREATE INDEX idx_hb_tasks_due_date ON hb_tasks(due_date);
CREATE INDEX idx_hb_projects_family_id ON hb_projects(family_id);
CREATE INDEX idx_hb_availability_user_id ON hb_availability_blocks(user_id);
CREATE INDEX idx_hb_availability_time_range ON hb_availability_blocks(start_time, end_time);
CREATE INDEX idx_hb_weekly_totals_user_week ON hb_weekly_totals(user_id, week_start);
CREATE INDEX idx_hb_integration_accounts_family ON hb_integration_accounts(family_id);
CREATE INDEX idx_hb_event_map_task ON hb_event_map(task_id);

-- Updated at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION hb_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_hb_families_updated_at BEFORE UPDATE ON hb_families FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_users_updated_at BEFORE UPDATE ON hb_users FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_children_updated_at BEFORE UPDATE ON hb_children FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_tasks_updated_at BEFORE UPDATE ON hb_tasks FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_projects_updated_at BEFORE UPDATE ON hb_projects FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_availability_blocks_updated_at BEFORE UPDATE ON hb_availability_blocks FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_weekly_totals_updated_at BEFORE UPDATE ON hb_weekly_totals FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_integration_accounts_updated_at BEFORE UPDATE ON hb_integration_accounts FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
CREATE TRIGGER update_hb_event_map_updated_at BEFORE UPDATE ON hb_event_map FOR EACH ROW EXECUTE FUNCTION hb_update_updated_at_column();
