// Database entity types based on PRD schema

export interface Family {
  id: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  family_id: string;
  email: string;
  role: 'parent_a' | 'parent_b';
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  title: string;
  notes?: string;
  due_date?: string;
  recurrence_rule?: string; // RRULE format
  assignee_user_id?: string;
  type: 'cyclical' | 'project';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlock {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  type: 'work' | 'childcare' | 'personal';
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyTotals {
  id: string;
  user_id: string;
  week_start: string;
  work_minutes: number;
  childcare_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface IntegrationAccount {
  id: string;
  family_id: string;
  provider: 'google_calendar' | 'google_maps';
  account_email: string;
  calendars?: GoogleCalendarInfo[];
  access_token?: string;
  refresh_token?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarInfo {
  calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
  is_selected_for_homebase: boolean;
}

export interface HomebaseEventMap {
  id: string;
  task_id: string;
  google_event_id: string;
  calendar_id: string;
  created_at: string;
  updated_at: string;
}