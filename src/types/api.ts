// API Contract Types for Homebase

import { Task, User, Child, AvailabilityBlock, WeeklyTotals } from './database';
import { 
  WeeklyView, 
  TaskWithAssignee, 
  Alert, 
  SyncResult, 
  TaskInput, 
  NaturalInputResult,
  ParentWeeklyTotals 
} from './domain';

// Common API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Weekly View API
export interface GetWeeklyViewRequest {
  startDate: string; // ISO date
  familyId: string;
}

export interface GetWeeklyViewResponse extends ApiResponse<WeeklyView> {}

// Tasks API
export interface CreateTaskRequest {
  task: TaskInput;
}

export interface CreateTaskResponse extends ApiResponse<TaskWithAssignee> {}

export interface UpdateTaskRequest {
  taskId: string;
  updates: Partial<TaskInput>;
}

export interface UpdateTaskResponse extends ApiResponse<TaskWithAssignee> {}

export interface DeleteTaskRequest {
  taskId: string;
}

export interface DeleteTaskResponse extends ApiResponse<{ deleted: boolean }> {}

export interface GetTasksRequest {
  familyId: string;
  startDate?: string;
  endDate?: string;
  type?: 'cyclical' | 'project';
  assigneeId?: string;
}

export interface GetTasksResponse extends ApiResponse<TaskWithAssignee[]> {}

export interface AssignTaskRequest {
  taskId: string;
  assigneeUserId: string;
  dueDate?: string;
}

export interface AssignTaskResponse extends ApiResponse<TaskWithAssignee> {}

// Availability API
export interface CreateAvailabilityBlockRequest {
  block: {
    userId: string;
    startTime: string;
    endTime: string;
    type: 'work' | 'childcare' | 'personal';
    isRecurring: boolean;
    recurrencePattern?: string;
  };
}

export interface CreateAvailabilityBlockResponse extends ApiResponse<AvailabilityBlock> {}

export interface UpdateAvailabilityBlockRequest {
  blockId: string;
  updates: {
    startTime?: string;
    endTime?: string;
    type?: 'work' | 'childcare' | 'personal';
    recurrencePattern?: string;
  };
}

export interface UpdateAvailabilityBlockResponse extends ApiResponse<AvailabilityBlock> {}

export interface DeleteAvailabilityBlockRequest {
  blockId: string;
}

export interface DeleteAvailabilityBlockResponse extends ApiResponse<{ deleted: boolean }> {}

export interface GetAvailabilityRequest {
  familyId: string;
  startDate: string;
  endDate: string;
  userId?: string;
}

export interface GetAvailabilityResponse extends ApiResponse<AvailabilityBlock[]> {}

// Weekly Totals API
export interface GetWeeklyTotalsRequest {
  familyId: string;
  weekStart: string;
}

export interface GetWeeklyTotalsResponse extends ApiResponse<ParentWeeklyTotals[]> {}

export interface RecalculateWeeklyTotalsRequest {
  familyId: string;
  weekStart: string;
}

export interface RecalculateWeeklyTotalsResponse extends ApiResponse<ParentWeeklyTotals[]> {}

// Sync API (Google Calendar)
export interface InitiateSyncRequest {
  familyId: string;
  forceFullSync?: boolean;
}

export interface InitiateSyncResponse extends ApiResponse<SyncResult> {}

export interface GetSyncStatusRequest {
  familyId: string;
}

export interface GetSyncStatusResponse extends ApiResponse<{
  isConnected: boolean;
  lastSync: string;
  syncErrors: string[];
}> {}

export interface ConnectGoogleCalendarRequest {
  familyId: string;
  authCode: string;
  redirectUri: string;
}

export interface ConnectGoogleCalendarResponse extends ApiResponse<{
  connected: boolean;
  calendars: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
}> {}

// Alerts API
export interface GetAlertsRequest {
  familyId: string;
  includeResolved?: boolean;
}

export interface GetAlertsResponse extends ApiResponse<Alert[]> {}

export interface ResolveAlertRequest {
  alertId: string;
}

export interface ResolveAlertResponse extends ApiResponse<{ resolved: boolean }> {}

export interface DismissAlertRequest {
  alertId: string;
}

export interface DismissAlertResponse extends ApiResponse<{ dismissed: boolean }> {}

// Natural Input API
export interface ParseNaturalInputRequest {
  input: string;
  inputType: 'text' | 'voice' | 'photo';
  context?: {
    familyId: string;
    currentDate: string;
  };
}

export interface ParseNaturalInputResponse extends ApiResponse<NaturalInputResult> {}

// Auth and User Management
export interface GetUserProfileResponse extends ApiResponse<User> {}

export interface UpdateUserProfileRequest {
  updates: {
    name?: string;
    email?: string;
  };
}

export interface UpdateUserProfileResponse extends ApiResponse<User> {}

export interface GetFamilyMembersResponse extends ApiResponse<{
  parents: User[];
  children: Child[];
}> {}

// Error Response Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
  statusCode?: number;
}