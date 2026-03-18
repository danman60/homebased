'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dashboard } from '@/components/dashboard';
import { WeeklyView } from '@/types/domain';
import { startOfWeek } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';

interface DashboardClientProps {
  familyId: string;
  userId: string;
  userName: string;
  familyTimezone: string;
  parentIds: string[];
}

export function DashboardClient({ familyId, userId, userName, familyTimezone, parentIds }: DashboardClientProps) {
  const [weeklyView, setWeeklyView] = useState<WeeklyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchWeeklyView = useCallback(async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const response = await fetch(
        `/api/weekly?familyId=${familyId}&startDate=${weekStart.toISOString()}`
      );
      const result = await response.json();
      if (result.success) {
        setWeeklyView(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchWeeklyView();
  }, [fetchWeeklyView]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading your family dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchWeeklyView}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weeklyView) return null;

  return (
    <div>
      {/* User bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Logged in as <strong>{userName}</strong> | {familyTimezone}
        </span>
        <button
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-700"
        >
          Sign out
        </button>
      </div>

      <Dashboard
        weeklyView={weeklyView}
        familyId={familyId}
        parentIds={parentIds}
        onTaskDrop={async (taskId, newDate) => {
          await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: { dueDate: newDate.toISOString() } }),
          });
          fetchWeeklyView();
        }}
        onAlertDismiss={() => {
          // TODO: implement alert dismissal
        }}
        onCalendarSync={() => {
          fetchWeeklyView();
        }}
      />
    </div>
  );
}
