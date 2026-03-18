// Calendar connection status API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json(
        { error: 'Missing familyId parameter' },
        { status: 400 }
      );
    }

    const db = new DatabaseClient(supabaseServer);
    
    // Get integration accounts for this family
    const integrations = await db.getIntegrationAccounts(familyId);
    const googleIntegrations = integrations.filter(i => i.provider === 'google_calendar');

    const isConnected = googleIntegrations.length > 0 && 
                       googleIntegrations.some(i => i.access_token);

    // Get last sync time (you might want to store this in the database)
    const lastSync = googleIntegrations.length > 0 
      ? googleIntegrations[0].updated_at 
      : null;

    interface CalendarInfo {
      calendar_id: string;
      calendar_name: string;
      is_primary: boolean;
      is_selected_for_homebase: boolean;
    }

    const connectedAccounts = googleIntegrations.map(integration => ({
      id: integration.id,
      email: integration.account_email,
      calendars: integration.calendars ? (integration.calendars as CalendarInfo[])?.map((cal) => ({
        id: cal.calendar_id,
        name: cal.calendar_name,
        isPrimary: cal.is_primary,
        isSelected: cal.is_selected_for_homebase
      })) || [] : []
    }));

    return NextResponse.json({
      isConnected,
      lastSync,
      connectedAccounts,
      totalAccounts: googleIntegrations.length
    });
  } catch (error) {
    console.error('Calendar status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}