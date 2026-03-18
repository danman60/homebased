import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './client';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: hbUser } = await supabase
    .from('hb_users')
    .select('*, family:hb_families(*)')
    .eq('auth_user_id', user.id)
    .single();

  if (!hbUser) redirect('/onboarding');

  const { data: familyMembers } = await supabase
    .from('hb_users')
    .select('id, name, role')
    .eq('family_id', hbUser.family_id);

  const members = (familyMembers || []) as Array<{ id: string; name: string; role: string }>;

  return (
    <DashboardClient
      familyId={hbUser.family_id}
      userId={hbUser.id}
      userName={hbUser.name}
      familyTimezone={hbUser.family?.timezone || 'UTC'}
      parentIds={members.map(m => m.id)}
      familyMembers={members}
    />
  );
}
