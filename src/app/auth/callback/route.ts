import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}${redirectTo}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has an hb_users profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: hbUser } = await supabase
          .from('hb_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        // If no profile, redirect to onboarding
        if (!hbUser) {
          const onboardingUrl = new URL('/onboarding', origin);
          return NextResponse.redirect(onboardingUrl, {
            headers: supabaseResponse.headers,
          });
        }
      }

      return supabaseResponse;
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
