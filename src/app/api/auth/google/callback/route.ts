// Google OAuth callback handler - redirects from Google's authorization server
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL!);
      redirectUrl.searchParams.set('auth_error', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !state) {
      const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL!);
      redirectUrl.searchParams.set('auth_error', 'missing_parameters');
      return NextResponse.redirect(redirectUrl);
    }

    // Call our internal handler to process the tokens
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    if (response.ok) {
      // Success - redirect to main app with success message
      const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL!);
      redirectUrl.searchParams.set('auth_success', 'google_calendar');
      return NextResponse.redirect(redirectUrl);
    } else {
      // Error processing tokens
      const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL!);
      redirectUrl.searchParams.set('auth_error', 'token_exchange_failed');
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('auth_error', 'internal_error');
    return NextResponse.redirect(redirectUrl);
  }
}