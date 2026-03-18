import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DatabaseClient } from '@/lib/database/client';

/** Get authenticated user's hb_user profile + an authenticated DB client from cookies. */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - can't set cookies
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: hbUser } = await supabase
    .from('hb_users')
    .select('id, family_id, email, role, name')
    .eq('auth_user_id', user.id)
    .single();

  if (!hbUser) return null;

  // Get family timezone
  const { data: family } = await supabase
    .from('hb_families')
    .select('timezone')
    .eq('id', hbUser.family_id)
    .single();

  // Return an authenticated DatabaseClient that carries the user's session
  const db = new DatabaseClient(supabase);

  return {
    ...hbUser,
    authUserId: user.id,
    timezone: family?.timezone || 'UTC',
    db,
    supabase,
  };
}
