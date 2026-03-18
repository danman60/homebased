// Calendar synchronization API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarAdapter } from '@/lib/integrations/google-calendar';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';
import { addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { SyncConflict } from '@/types/domain';

interface CalendarSyncRequest {
  familyId: string;
  parentIds: string[]; // Parent 1 and Parent 2 user IDs
  action: 'pull' | 'push';
  forceFullSync?: boolean;
}

interface PullCalendarRequest {
  familyId: string;
  parentIds: string[];
  startDate?: string;
  endDate?: string;
}

interface PushCalendarRequest {
  familyId: string;
  taskIds?: string[]; // Specific tasks to push, or all if empty
  assignedParentId?: string; // Push only tasks assigned to specific parent
}

interface CalendarInfo {
  calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
  is_selected_for_homebase: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CalendarSyncRequest = await request.json();
    const { familyId, parentIds, action, forceFullSync = false } = body;

    if (!familyId || !parentIds || parentIds.length === 0 || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: familyId, parentIds, action' },
        { status: 400 }
      );
    }

    const db = new DatabaseClient(supabaseServer);
    const adapter = new GoogleCalendarAdapter(
      {
        clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      },
      db
    );

    if (action === 'pull') {
      const result = await pullFromGoogleCalendar(adapter, db, familyId, parentIds);
      return NextResponse.json(result);
    } else if (action === 'push') {
      const result = await pushToGoogleCalendar(adapter, db, familyId, parentIds, forceFullSync);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for pull-specific requests with query parameters
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId');
    const parentIds = url.searchParams.get('parentIds')?.split(',') || [];
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!familyId || parentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: familyId, parentIds' },
        { status: 400 }
      );
    }

    // Default to current week if no dates provided
    const start = startDate ? new Date(startDate) : startOfWeek(new Date());
    const end = endDate ? new Date(endDate) : endOfWeek(addWeeks(start, 1));

    const db = new DatabaseClient(supabaseServer);
    const adapter = new GoogleCalendarAdapter(
      {
        clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      },
      db
    );

    const result = await pullFromGoogleCalendar(adapter, db, familyId, parentIds, start, end);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Calendar pull error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function pullFromGoogleCalendar(
  adapter: GoogleCalendarAdapter,
  db: DatabaseClient,
  familyId: string,
  parentIds: string[],
  startDate: Date = startOfWeek(new Date()),
  endDate: Date = endOfWeek(addWeeks(startOfWeek(new Date()), 1))
) {
  const result = {
    success: true,
    eventsImported: 0,
    tasksCreated: 0,
    conflicts: [] as SyncConflict[],
    errors: [] as string[],
    parentResults: {} as Record<string, { parentId: string; eventsImported: number; tasksCreated: number; errors: string[] }>
};

  try {
    // Get integration accounts for both parents
    const integrations = await db.getIntegrationAccounts(familyId);
    const googleIntegrations = integrations.filter(i => i.provider === 'google_calendar');

    for (const parentId of parentIds) {
      const parentResult = {
        parentId,
        eventsImported: 0,
        tasksCreated: 0,
        errors: [] as string[]
      };

      try {
        // Find this parent's Google integration
        const parent = await db.getUser(parentId);
        const parentIntegration = googleIntegrations.find(
          i => i.account_email === parent.email || i.family_id === familyId
        );

        if (!parentIntegration || !parentIntegration.access_token) {
          parentResult.errors.push(`Google Calendar not connected for parent ${parentId}`);
          result.parentResults[parentId] = parentResult;
          continue;
        }

        // Get calendars for this parent
        const calendars = (parentIntegration.calendars || []) as CalendarInfo[];
        const selectedCalendars = calendars.filter(cal => cal.is_selected_for_homebase);

        if (selectedCalendars.length === 0) {
          parentResult.errors.push('No calendars selected for sync');
          result.parentResults[parentId] = parentResult;
          continue;
        }

        // Pull events from each selected calendar
        for (const calendar of selectedCalendars) {
          try {
            const events = await adapter.getEvents(
              parentIntegration.access_token!,
              calendar.calendar_id,
              startDate,
              endDate
            );

            // Filter out events already created by Homebase
            const externalEvents = events.filter(event => 
              !event.description?.includes('[Created by Homebase]')
            );

            // Convert events to tasks
            for (const event of externalEvents) {
              try {
                if (!event.start.dateTime) continue; // Skip all-day events for now

                // Check if we already imported this event
                const existingMapping = await db.getEventMapping(event.id);
                if (existingMapping.length > 0) continue;

                // Create task from event
                const task = await db.createTask({
                  family_id: familyId,
                  title: event.summary || 'Untitled Event',
                  notes: event.description ? `${event.description}\n\n[Imported from Google Calendar]` : '[Imported from Google Calendar]',
                  due_date: event.start.dateTime,
                  assignee_user_id: parentId,
                  type: 'project' // External events are treated as project tasks
                });

                // Create reverse mapping to track this import
                await db.createEventMapping({
                  task_id: task.id,
                  google_event_id: event.id,
                  calendar_id: calendar.calendar_id
                });

                parentResult.tasksCreated++;
                parentResult.eventsImported++;
              } catch (taskError) {
                parentResult.errors.push(`Failed to import event "${event.summary}": ${taskError}`);
              }
            }
          } catch (calendarError) {
            parentResult.errors.push(`Failed to fetch events from calendar ${calendar.calendar_name}: ${calendarError}`);
          }
        }
      } catch (parentError) {
        parentResult.errors.push(`Failed to process parent ${parentId}: ${parentError}`);
      }

      result.parentResults[parentId] = parentResult;
      result.eventsImported += parentResult.eventsImported;
      result.tasksCreated += parentResult.tasksCreated;
      result.errors.push(...parentResult.errors);
    }

    // Detect conflicts after importing
    const conflicts = await adapter.detectConflicts(familyId, startDate, endDate);
    result.conflicts = conflicts;

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Pull operation failed: ${error}`);
  }

  return result;
}

async function pushToGoogleCalendar(
  adapter: GoogleCalendarAdapter,
  db: DatabaseClient,
  familyId: string,
  parentIds: string[],
  forceFullSync: boolean = false
) {
  const result = {
    success: true,
    eventsCreated: 0,
    eventsUpdated: 0,
    conflicts: [] as string[],
    errors: [] as string[],
    parentResults: {} as Record<string, { parentId: string; eventsCreated: number; eventsUpdated: number; errors: string[] }>
  };

  try {
    // Get integration accounts for both parents
    const integrations = await db.getIntegrationAccounts(familyId);
    const googleIntegrations = integrations.filter(i => i.provider === 'google_calendar');

    for (const parentId of parentIds) {
      const parentResult = {
        parentId,
        eventsCreated: 0,
        eventsUpdated: 0,
        errors: [] as string[]
      };

      try {
        // Find this parent's Google integration
        const parent = await db.getUser(parentId);
        const parentIntegration = googleIntegrations.find(
          i => i.account_email === parent.email || i.family_id === familyId
        );

        if (!parentIntegration || !parentIntegration.access_token) {
          parentResult.errors.push(`Google Calendar not connected for parent ${parentId}`);
          result.parentResults[parentId] = parentResult;
          continue;
        }

        // Get tasks assigned to this parent
        const tasks = await db.getTasks(familyId, {
          assigneeId: parentId,
          startDate: new Date().toISOString()
        });

        // Only sync tasks with due dates
        const tasksToSync = tasks.filter(task => task.due_date);

        // Get the primary calendar or first selected calendar for pushing
        const calendars = (parentIntegration.calendars || []) as CalendarInfo[];
        const targetCalendar = calendars.find(cal => cal.is_primary) || 
                              calendars.find(cal => cal.is_selected_for_homebase) ||
                              calendars[0];

        if (!targetCalendar) {
          parentResult.errors.push('No target calendar available for pushing');
          result.parentResults[parentId] = parentResult;
          continue;
        }

        for (const task of tasksToSync) {
          try {
            const dueDate = task.due_date!;
            const existingMapping = await db.getEventMapping(task.id);

            if (existingMapping.length > 0 && !forceFullSync) {
              // Update existing event
              const mapping = existingMapping[0];
              await adapter.updateEvent(
                parentIntegration.access_token!,
                mapping.calendar_id,
                mapping.google_event_id,
                {
                  summary: task.title,
                  description: `${task.notes || ''}\n\n[Created by Homebase]`,
                  start: {
                    dateTime: dueDate,
                    timeZone: 'America/New_York' // TODO: Get from family timezone
                  },
                  end: {
                    dateTime: new Date(new Date(dueDate).getTime() + 3600000).toISOString(),
                    timeZone: 'America/New_York'
                  }
                }
              );
              parentResult.eventsUpdated++;
            } else {
              // Create new event
              const createdEvent = await adapter.createEvent(
                parentIntegration.access_token!,
                targetCalendar.calendar_id,
                {
                  summary: task.title,
                  description: `${task.notes || ''}\n\n[Created by Homebase]`,
                  start: {
                    dateTime: dueDate,
                    timeZone: 'America/New_York'
                  },
                  end: {
                    dateTime: new Date(new Date(dueDate).getTime() + 3600000).toISOString(),
                    timeZone: 'America/New_York'
                  }
                }
              );

              // Store mapping
              await db.createEventMapping({
                task_id: task.id,
                google_event_id: createdEvent.id,
                calendar_id: targetCalendar.calendar_id
              });

              parentResult.eventsCreated++;
            }
          } catch (taskError) {
            parentResult.errors.push(`Failed to sync task "${task.title}": ${taskError}`);
          }
        }
      } catch (parentError) {
        parentResult.errors.push(`Failed to process parent ${parentId}: ${parentError}`);
      }

      result.parentResults[parentId] = parentResult;
      result.eventsCreated += parentResult.eventsCreated;
      result.eventsUpdated += parentResult.eventsUpdated;
      result.errors.push(...parentResult.errors);
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Push operation failed: ${error}`);
  }

  return result;
}