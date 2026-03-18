'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [familyTimezone, setFamilyTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [role, setRole] = useState<'parent_a' | 'parent_b'>('parent_a');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [mode, setMode] = useState<'new' | 'join'>('new');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Pre-fill name from Google profile
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      }
    });
  }, [supabase.auth]);

  const handleCreateFamily = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('hb_families')
        .insert({ timezone: familyTimezone })
        .select()
        .single();

      if (familyError) throw familyError;

      // Create user profile
      const { error: userError } = await supabase
        .from('hb_users')
        .insert({
          auth_user_id: user.id,
          family_id: family.id,
          email: user.email!,
          role,
          name,
        });

      if (userError) throw userError;

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Look up the family by invite code (family ID for now)
      const { data: family, error: familyError } = await supabase
        .from('hb_families')
        .select('id')
        .eq('id', inviteCode)
        .single();

      if (familyError || !family) {
        throw new Error('Invalid invite code. Ask your partner for the family ID.');
      }

      // Create user profile in the existing family
      const { error: userError } = await supabase
        .from('hb_users')
        .insert({
          auth_user_id: user.id,
          family_id: family.id,
          email: user.email!,
          role: 'parent_b',
          name,
        });

      if (userError) throw userError;

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-lg p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Homebase</h1>
          <p className="text-slate-600 mb-6">Let&apos;s set up your family profile.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. Alex"
          />

          {/* New or Join */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                mode === 'new'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Create new family
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                mode === 'join'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Join existing family
            </button>
          </div>

          {mode === 'new' ? (
            <>
              {/* Role */}
              <label className="block text-sm font-medium text-slate-700 mb-1">Your role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'parent_a' | 'parent_b')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="parent_a">Parent A (primary)</option>
                <option value="parent_b">Parent B</option>
              </select>

              {/* Timezone */}
              <label className="block text-sm font-medium text-slate-700 mb-1">Family timezone</label>
              <input
                type="text"
                value={familyTimezone}
                onChange={(e) => setFamilyTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />

              <button
                onClick={handleCreateFamily}
                disabled={loading || !name}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Family'}
              </button>
            </>
          ) : (
            <>
              {/* Invite code */}
              <label className="block text-sm font-medium text-slate-700 mb-1">Family invite code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Paste the family ID from your partner"
              />

              <button
                onClick={handleJoinFamily}
                disabled={loading || !name || !inviteCode}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Joining...' : 'Join Family'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
