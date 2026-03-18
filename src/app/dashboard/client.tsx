'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dashboard } from '@/components/dashboard';
import { WeeklyView } from '@/types/domain';
import { startOfWeek } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';
import { TaskModal, TaskFormData } from '@/components/task-modal/TaskModal';
import { Plus } from 'lucide-react';

interface DashboardClientProps {
  familyId: string;
  userId: string;
  userName: string;
  familyTimezone: string;
  parentIds: string[];
  familyMembers: Array<{ id: string; name: string; role: string }>;
}

export function DashboardClient({ familyId, userId, userName, familyTimezone, parentIds, familyMembers }: DashboardClientProps) {
  const [weeklyView, setWeeklyView] = useState<WeeklyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: string; data: Partial<TaskFormData> } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchWeeklyView = useCallback(async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const response = await fetch(`/api/weekly?familyId=${familyId}&startDate=${weekStart.toISOString()}`);
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

  useEffect(() => { fetchWeeklyView(); }, [fetchWeeklyView]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const handleCreateTask = async (form: TaskFormData) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: {
          title: form.title,
          notes: form.notes || undefined,
          type: form.type,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          recurrenceRule: form.recurrenceRule || undefined,
          assigneeUserId: form.assigneeUserId || undefined,
        }
      }),
    });
    fetchWeeklyView();
  };

  const handleEditTask = async (form: TaskFormData) => {
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: {
          title: form.title,
          notes: form.notes || undefined,
          type: form.type,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          recurrenceRule: form.recurrenceRule || undefined,
          assigneeUserId: form.assigneeUserId || undefined,
        }
      }),
    });
    setEditingTask(null);
    fetchWeeklyView();
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, { method: 'DELETE' });
    setEditingTask(null);
    fetchWeeklyView();
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
          <button onClick={fetchWeeklyView} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
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
          <strong>{userName}</strong> | {familyTimezone}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-700">Sign out</button>
        </div>
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
        onTaskEdit={(taskId) => {
          const task = weeklyView.tasks.find((t: { id: string }) => t.id === taskId);
          if (task) {
            setEditingTask({
              id: taskId,
              data: {
                title: task.title,
                notes: task.notes || '',
                type: task.type,
                dueDate: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
                assigneeUserId: task.assignee_user_id || '',
                recurrenceRule: task.recurrence_rule || '',
              }
            });
          }
        }}
        onAlertDismiss={() => {}}
        onCalendarSync={() => fetchWeeklyView()}
      />

      {/* Create Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleCreateTask}
        familyMembers={familyMembers}
        mode="create"
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditTask}
        onDelete={handleDeleteTask}
        initialData={editingTask?.data}
        familyMembers={familyMembers}
        mode="edit"
      />
    </div>
  );
}
