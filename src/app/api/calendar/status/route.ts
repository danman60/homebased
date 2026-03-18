// Calendar connection status API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

interface CalendarInfo {
  calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
  is_selected_for_homebase: boolean;
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const integrations = await auth.db.getIntegrationAccounts(auth.family_id);
    const googleIntegrations = integrations.filter(i => i.provider === 'google_calendar');

    const isConnected = googleIntegrations.length > 0 &&
                       googleIntegrations.some(i => i.access_token);

    const lastSync = googleIntegrations.length > 0
      ? googleIntegrations[0].updated_at
      : null;

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
