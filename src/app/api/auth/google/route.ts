// Google Calendar OAuth authentication endpoints
import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarAdapter } from '@/lib/integrations/google-calendar';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';

interface AuthorizeRequest {
  familyId: string;
  parentId: string;
  parentEmail: string;
}

interface CallbackRequest {
  code: string;
  state: string; // Contains familyId:parentId:parentEmail
}

// GET /api/auth/google - Start OAuth flow
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId');
    const parentId = url.searchParams.get('parentId');
    const parentEmail = url.searchParams.get('parentEmail');

    if (!familyId || !parentId || !parentEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters: familyId, parentId, parentEmail' },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    
    // Encode state to pass through OAuth flow
    const state = `${familyId}:${parentId}:${parentEmail}`;
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;

    // Return redirect URL or redirect directly
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth start error:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/auth/google - Handle OAuth callback
export async function POST(request: NextRequest) {
  try {
    const body: CallbackRequest = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    // Parse state
    const [familyId, parentId, parentEmail] = state.split(':');
    if (!familyId || !parentId || !parentEmail) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const db = new DatabaseClient(supabaseServer);
    const adapter = new GoogleCalendarAdapter(
      {
        clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      },
      db
    );

    // Exchange code for tokens
    const tokens = await adapter.exchangeCodeForTokens(code);

    // Get user's calendar list
    const calendars = await adapter.getCalendarList(tokens.access_token);

    // Prepare calendar info for storage
    const calendarInfos = calendars.map(cal => ({
      calendar_id: cal.id,
      calendar_name: cal.name,
      is_primary: cal.isPrimary,
      is_selected_for_homebase: cal.isPrimary // Default to primary calendar selected
    }));

    // Store/update integration account
    const integrationAccount = await db.upsertIntegrationAccount({
      family_id: familyId,
      provider: 'google_calendar',
      account_email: parentEmail,
      calendars: calendarInfos,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });

    return NextResponse.json({
      success: true,
      message: 'Google Calendar connected successfully',
      calendars: calendarInfos,
      account: {
        id: integrationAccount.id,
        email: parentEmail,
        provider: 'google_calendar' as const
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Failed to complete OAuth flow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}