// Domain types for business logic

import { Task, AvailabilityBlock, User, Child } from './database';

export interface WeeklyView {
  startDate: Date;
  endDate: Date;
  tasks: TaskWithAssignee[];
  availabilityBlocks: AvailabilityBlockWithUser[];
  alerts: Alert[];
  weeklyTotals: ParentWeeklyTotals[];
  socialBlocks: SocialBlock[];
}

export interface TaskWithAssignee extends Task {
  assignee?: User;
  child?: Child;
}

export interface AvailabilityBlockWithUser extends AvailabilityBlock {
  user: User;
}

export interface ParentWeeklyTotals {
  userId: string;
  userName: string;
  workHours: number;
  childcareHours: number;
  totalHours: number;
  ratio: number; // work hours / childcare hours
}

export interface SocialBlock {
  id: string;
  dayOfWeek: number; // 0-6, Sunday = 0
  startHour: number;
  endHour: number;
  label: string;
  isDefault: boolean;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning';
  category: 'missing_assignment' | 'missing_details' | 'conflict' | 'travel_time';
  title: string;
  description: string;
  taskId?: string;
  actionRequired: boolean;
  createdAt: Date;
}

// Google Calendar Integration Types
export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string | null;
  start: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  end: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string | null;
  }> | null;
  creator?: {
    email: string;
  } | null;
  organizer?: {
    email: string;
  } | null;
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  eventsCreated: number;
  eventsUpdated: number;
  errors: string[];
}

export interface SyncConflict {
  type: 'hard' | 'soft';
  taskId: string;
  conflictingEventId: string;
  message: string;
  canOverride: boolean;
}

// Form Input Types
export interface TaskInput {
  title: string;
  notes?: string;
  dueDate?: Date;
  recurrenceRule?: string;
  type: 'cyclical' | 'project';
  assigneeUserId?: string;
}

export interface NaturalInputResult {
  parsedTasks: TaskInput[];
  confidence: number;
  originalInput: string;
  inputType: 'text' | 'voice' | 'photo';
}

// UI State Types
export interface DragDropState {
  isDragging: boolean;
  draggedTask?: TaskWithAssignee;
  dropTarget?: {
    date: Date;
    hour: number;
    userId?: string;
  };
}

export interface GridCell {
  date: Date;
  hour: number;
  tasks: TaskWithAssignee[];
  availabilityType?: 'work' | 'childcare' | 'personal';
  hasConflict: boolean;
  isBlocked: boolean; // hard constraint
}