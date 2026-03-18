// Google Calendar integration adapter

import { google, calendar_v3 } from 'googleapis';
import { GoogleEvent, SyncResult, SyncConflict } from '@/types/domain';
import { DatabaseClient } from '@/lib/database/client';

interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export class GoogleCalendarAdapter {
  private config: GoogleCalendarConfig;
  private db: DatabaseClient;
  private oauth2Client;

  constructor(config: GoogleCalendarConfig, db: DatabaseClient) {
    this.config = config;
    this.db = db;
    
    // Initialize Google OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    
    // Set up Google API with OAuth2 client
    google.options({ auth: this.oauth2Client });
  }

  /**
   * Set access token for the OAuth2 client
   */
  private setAccessToken(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  /**
   * Get Calendar API client
   */
  private getCalendarClient(): calendar_v3.Calendar {
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Exchange OAuth code for access tokens
   */
  async exchangeCodeForTokens(authCode: string): Promise<GoogleTokenResponse> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/calendar'
      };
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(authCode);
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope || 'https://www.googleapis.com/auth/calendar'
      };
    } catch (error) {
      throw new Error(`Token exchange failed: ${error}`);
    }
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return [
        { id: 'primary', name: 'Personal Calendar', isPrimary: true },
        { id: 'family@example.com', name: 'Family Calendar', isPrimary: false }
      ];
    }

    try {
      this.setAccessToken(accessToken);
      const calendar = this.getCalendarClient();
      
      const response = await calendar.calendarList.list();
      
      return response.data.items?.map(item => ({
        id: item.id!,
        name: item.summary!,
        isPrimary: item.primary || false
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch calendars: ${error}`);
    }
  }

  /**
   * Get events from a calendar within date range
   */
  async getEvents(
    accessToken: string, 
    calendarId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<GoogleEvent[]> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return [
        {
          id: 'mock_event_1',
          summary: 'Team Meeting',
          start: {
            dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            timeZone: 'America/New_York'
          },
          end: {
            dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
            timeZone: 'America/New_York'
          },
          attendees: [{ email: 'colleague@example.com' }]
        }
      ];
    }

    try {
      this.setAccessToken(accessToken);
      const calendar = this.getCalendarClient();
      
      const response = await calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items?.map(event => ({
        id: event.id!,
        summary: event.summary || 'Untitled Event',
        description: event.description,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          responseStatus: attendee.responseStatus
        })),
        creator: event.creator ? { email: event.creator.email! } : undefined,
        organizer: event.organizer ? { email: event.organizer.email! } : undefined
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch events: ${error}`);
    }
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(
    accessToken: string,
    calendarId: string,
    event: Omit<GoogleEvent, 'id'>
  ): Promise<GoogleEvent> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return {
        id: `mock_created_${Date.now()}`,
        ...event
      };
    }

    try {
      this.setAccessToken(accessToken);
      const calendar = this.getCalendarClient();
      
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description ?? undefined,
          start: {
            dateTime: event.start.dateTime ?? undefined,
            date: event.start.date ?? undefined,
            timeZone: event.start.timeZone ?? undefined,
          },
          end: {
            dateTime: event.end.dateTime ?? undefined,
            date: event.end.date ?? undefined,
            timeZone: event.end.timeZone ?? undefined,
          },
          attendees: event.attendees?.map(a => ({ email: a.email, responseStatus: a.responseStatus ?? undefined })) ?? undefined
        }
      });

      const createdEvent = response.data;
      return {
        id: createdEvent.id!,
        summary: createdEvent.summary!,
        description: createdEvent.description,
        start: {
          dateTime: createdEvent.start?.dateTime,
          date: createdEvent.start?.date,
          timeZone: createdEvent.start?.timeZone
        },
        end: {
          dateTime: createdEvent.end?.dateTime,
          date: createdEvent.end?.date,
          timeZone: createdEvent.end?.timeZone
        },
        attendees: createdEvent.attendees?.map(attendee => ({
          email: attendee.email!,
          responseStatus: attendee.responseStatus
        })),
        creator: createdEvent.creator ? { email: createdEvent.creator.email! } : undefined,
        organizer: createdEvent.organizer ? { email: createdEvent.organizer.email! } : undefined
      };
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<GoogleEvent>
  ): Promise<GoogleEvent> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return {
        id: eventId,
        summary: event.summary || 'Updated Event',
        start: event.start || { dateTime: new Date().toISOString() },
        end: event.end || { dateTime: new Date(Date.now() + 3600000).toISOString() }
      };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // Mock implementation for development
      return;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }
  }

  /**
   * Sync Homebase tasks with Google Calendar
   */
  async syncTasksToCalendar(
    familyId: string,
    forceFullSync: boolean = false
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      conflicts: [],
      eventsCreated: 0,
      eventsUpdated: 0,
      errors: []
    };

    try {
      // Get integration account details
      const integrations = await this.db.getIntegrationAccounts(familyId);
      const googleIntegration = integrations.find(i => i.provider === 'google_calendar');

      if (!googleIntegration || !googleIntegration.access_token) {
        result.success = false;
        result.errors.push('Google Calendar not connected');
        return result;
      }

      // Get tasks that need syncing
      const tasks = await this.db.getTasks(familyId, {
        // Only sync tasks with due dates
        startDate: new Date().toISOString()
      });

      const tasksToSync = tasks.filter(task => 
        task.due_date && task.assignee_user_id
      );

      for (const task of tasksToSync) {
        try {
          const dueDate = task.due_date!;
          const existingMapping = await this.db.getEventMapping(task.id);

          if (existingMapping.length > 0 && !forceFullSync) {
            // Update existing event
            const mapping = existingMapping[0];
            await this.updateEvent(
              googleIntegration.access_token!,
              mapping.calendar_id,
              mapping.google_event_id,
              {
                summary: task.title,
                description: task.notes || undefined,
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
            result.eventsUpdated++;
          } else {
            // Create new event
            const calendarId = googleIntegration.calendars?.[0]?.calendar_id || 'primary';
            const createdEvent = await this.createEvent(
              googleIntegration.access_token!,
              calendarId,
              {
                summary: task.title,
                description: task.notes || undefined,
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
            await this.db.createEventMapping({
              task_id: task.id,
              google_event_id: createdEvent.id,
              calendar_id: calendarId
            });

            result.eventsCreated++;
          }
        } catch (error) {
          result.errors.push(`Failed to sync task ${task.title}: ${error}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  /**
   * Detect conflicts between tasks and existing calendar events
   */
  async detectConflicts(
    familyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    try {
      const integrations = await this.db.getIntegrationAccounts(familyId);
      const googleIntegration = integrations.find(i => i.provider === 'google_calendar');

      if (!googleIntegration || !googleIntegration.access_token) {
        return conflicts;
      }

      // Get external events (not created by Homebase)
      const calendars = googleIntegration.calendars || [];
      for (const calendar of calendars) {
        const events = await this.getEvents(
          googleIntegration.access_token!,
          calendar.calendar_id,
          startDate,
          endDate
        );

        // Filter out Homebase-created events
        const externalEvents = events.filter(event => 
          !event.description?.includes('[Created by Homebase]')
        );

        // Check for conflicts with tasks
        const tasks = await this.db.getTasks(familyId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        for (const task of tasks) {
          if (!task.due_date || !task.assignee_user_id) continue;

          const taskStart = new Date(task.due_date);
          const taskEnd = new Date(taskStart.getTime() + 3600000); // Assume 1 hour

          for (const event of externalEvents) {
            const eventStart = new Date(event.start.dateTime || event.start.date!);
            const eventEnd = new Date(event.end.dateTime || event.end.date!);

            // Check for time overlap
            if (taskStart < eventEnd && taskEnd > eventStart) {
              const isHardConflict = event.attendees && event.attendees.length > 1;
              
              conflicts.push({
                type: isHardConflict ? 'hard' : 'soft',
                taskId: task.id,
                conflictingEventId: event.id,
                message: `Task "${task.title}" conflicts with "${event.summary}"`,
                canOverride: !isHardConflict
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }

    return conflicts;
  }
}