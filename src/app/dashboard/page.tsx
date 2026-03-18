import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './client';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get hb_user profile
  const { data: hbUser } = await supabase
    .from('hb_users')
    .select('*, family:hb_families(*)')
    .eq('auth_user_id', user.id)
    .single();

  if (!hbUser) redirect('/onboarding');

  // Get family members (for parentIds)
  const { data: familyMembers } = await supabase
    .from('hb_users')
    .select('id, name, role')
    .eq('family_id', hbUser.family_id);

  return (
    <DashboardClient
      familyId={hbUser.family_id}
      userId={hbUser.id}
      userName={hbUser.name}
      familyTimezone={hbUser.family?.timezone || 'UTC'}
      parentIds={(familyMembers || []).map((m: { id: string }) => m.id)}
    />
  );
}
