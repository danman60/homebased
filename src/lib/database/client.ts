// Supabase database client configuration

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (untyped to avoid Supabase generic resolution issues)
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

// Client-side browser client
export const createSupabaseBrowser = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

// Common joined types
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type AvailabilityRow = Database['public']['Tables']['availability_blocks']['Row'];
type WeeklyTotalsRow = Database['public']['Tables']['weekly_totals']['Row'];
type EventMapRow = Database['public']['Tables']['homebase_event_map']['Row'];
type IntegrationRow = Database['public']['Tables']['integration_accounts']['Row'];
export type TaskWithAssignee = TaskRow & { assignee: UserRow | null };
type AvailabilityWithUser = AvailabilityRow & { user: UserRow | null };
type WeeklyTotalsWithUser = WeeklyTotalsRow & { user: UserRow | null };

// Input types for inserts
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type AvailabilityInsert = Database['public']['Tables']['availability_blocks']['Insert'];
type AvailabilityUpdate = Database['public']['Tables']['availability_blocks']['Update'];
type WeeklyTotalsInsert = Database['public']['Tables']['weekly_totals']['Insert'];
type IntegrationInsert = Database['public']['Tables']['integration_accounts']['Insert'];
type EventMapInsert = Database['public']['Tables']['homebase_event_map']['Insert'];

// Type-safe database client with helper methods
export class DatabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: SupabaseClient<any, any, any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client: SupabaseClient<any, any, any>) {
    this.client = client;
  }

  // Family operations
  async getFamily(familyId: string) {
    const { data, error } = await this.client
      .from('hb_families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (error) throw error;
    return data;
  }

  // User operations
  async getFamilyUsers(familyId: string) {
    const { data, error } = await this.client
      .from('hb_users')
      .select('*')
      .eq('family_id', familyId);

    if (error) throw error;
    return data;
  }

  async getUser(userId: string) {
    const { data, error } = await this.client
      .from('hb_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserRow;
  }

  async getUserByAuthId(authUserId: string) {
    const { data, error } = await this.client
      .from('hb_users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) throw error;
    return data as UserRow & { auth_user_id: string };
  }

  // Task operations
  async getTasks(familyId: string, filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'cyclical' | 'project';
    assigneeId?: string;
  }) {
    let query = this.client
      .from('hb_tasks')
      .select(`
        *,
        assignee:hb_users(*)
      `)
      .eq('family_id', familyId);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.assigneeId) {
      query = query.eq('assignee_user_id', filters.assigneeId);
    }
    if (filters?.startDate) {
      query = query.gte('due_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('due_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as TaskWithAssignee[];
  }

  async createTask(task: TaskInsert): Promise<TaskWithAssignee> {
    const { data, error } = await this.client
      .from('hb_tasks')
      .insert(task)
      .select(`
        *,
        assignee:hb_users(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as TaskWithAssignee;
  }

  async updateTask(taskId: string, updates: TaskUpdate): Promise<TaskWithAssignee> {
    const { data, error } = await this.client
      .from('hb_tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        assignee:hb_users(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as TaskWithAssignee;
  }

  async deleteTask(taskId: string) {
    const { error } = await this.client
      .from('hb_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return { deleted: true };
  }

  // Availability operations
  async getAvailabilityBlocks(userId: string, startDate: string, endDate: string): Promise<AvailabilityWithUser[]> {
    const { data, error } = await this.client
      .from('hb_availability_blocks')
      .select(`
        *,
        user:hb_users(*)
      `)
      .eq('user_id', userId)
      .gte('start_time', startDate)
      .lte('end_time', endDate);

    if (error) throw error;
    return data as unknown as AvailabilityWithUser[];
  }

  async getFamilyAvailability(familyId: string, startDate: string, endDate: string): Promise<AvailabilityWithUser[]> {
    const { data, error } = await this.client
      .from('hb_availability_blocks')
      .select(`
        *,
        user:hb_users!inner(*)
      `)
      .eq('user.family_id', familyId)
      .gte('start_time', startDate)
      .lte('end_time', endDate);

    if (error) throw error;
    return data as unknown as AvailabilityWithUser[];
  }

  async createAvailabilityBlock(block: AvailabilityInsert): Promise<AvailabilityWithUser> {
    const { data, error } = await this.client
      .from('hb_availability_blocks')
      .insert(block)
      .select(`
        *,
        user:hb_users(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as AvailabilityWithUser;
  }

  async updateAvailabilityBlock(blockId: string, updates: AvailabilityUpdate): Promise<AvailabilityWithUser> {
    const { data, error } = await this.client
      .from('hb_availability_blocks')
      .update(updates)
      .eq('id', blockId)
      .select(`
        *,
        user:hb_users(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as AvailabilityWithUser;
  }

  async deleteAvailabilityBlock(blockId: string) {
    const { error } = await this.client
      .from('hb_availability_blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;
    return { deleted: true };
  }

  // Weekly totals operations
  async getWeeklyTotals(familyId: string, weekStart: string): Promise<WeeklyTotalsWithUser[]> {
    const { data, error } = await this.client
      .from('hb_weekly_totals')
      .select(`
        *,
        user:hb_users!inner(*)
      `)
      .eq('user.family_id', familyId)
      .eq('week_start', weekStart);

    if (error) throw error;
    return data as unknown as WeeklyTotalsWithUser[];
  }

  async upsertWeeklyTotals(totals: WeeklyTotalsInsert): Promise<WeeklyTotalsWithUser> {
    const { data, error } = await this.client
      .from('hb_weekly_totals')
      .upsert(totals, { onConflict: 'user_id,week_start' })
      .select(`
        *,
        user:hb_users(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as WeeklyTotalsWithUser;
  }

  // Integration operations
  async getIntegrationAccounts(familyId: string) {
    const { data, error } = await this.client
      .from('hb_integration_accounts')
      .select('*')
      .eq('family_id', familyId);

    if (error) throw error;
    return data as IntegrationRow[];
  }

  async upsertIntegrationAccount(account: IntegrationInsert) {
    const { data, error } = await this.client
      .from('hb_integration_accounts')
      .upsert(account, { onConflict: 'family_id,provider,account_email' })
      .select('*')
      .single();

    if (error) throw error;
    return data as IntegrationRow;
  }

  // Event mapping operations
  async getEventMapping(taskId: string) {
    const { data, error } = await this.client
      .from('hb_event_map')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;
    return data as EventMapRow[];
  }

  async createEventMapping(mapping: EventMapInsert) {
    const { data, error } = await this.client
      .from('hb_event_map')
      .insert(mapping)
      .select('*')
      .single();

    if (error) throw error;
    return data as EventMapRow;
  }

  async deleteEventMapping(taskId: string, googleEventId?: string) {
    let query = this.client
      .from('hb_event_map')
      .delete()
      .eq('task_id', taskId);

    if (googleEventId) {
      query = query.eq('google_event_id', googleEventId);
    }

    const { error } = await query;
    if (error) throw error;
    return { deleted: true };
  }
}
