'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: Partial<TaskFormData>;
  familyMembers: Array<{ id: string; name: string; role: string }>;
  mode: 'create' | 'edit';
}

export interface TaskFormData {
  title: string;
  notes: string;
  type: 'cyclical' | 'project';
  dueDate: string;
  recurrenceRule: string;
  assigneeUserId: string;
}

export function TaskModal({ isOpen, onClose, onSave, onDelete, initialData, familyMembers, mode }: TaskModalProps) {
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    notes: '',
    type: 'project',
    dueDate: '',
    recurrenceRule: '',
    assigneeUserId: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        notes: initialData.notes || '',
        type: initialData.type || 'project',
        dueDate: initialData.dueDate || '',
        recurrenceRule: initialData.recurrenceRule || '',
        assigneeUserId: initialData.assigneeUserId || '',
      });
    } else {
      setForm({ title: '', notes: '', type: 'project', dueDate: '', recurrenceRule: '', assigneeUserId: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'New Task' : 'Edit Task'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Soccer practice - Liam"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, type: 'cyclical' }))}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === 'cyclical' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Recurring
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, type: 'project' }))}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === 'project' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                One-time
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Recurrence (for cyclical) */}
          {form.type === 'cyclical' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recurrence</label>
              <select
                value={form.recurrenceRule}
                onChange={e => setForm(f => ({ ...f, recurrenceRule: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">No recurrence</option>
                <option value="FREQ=DAILY">Daily</option>
                <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Weekdays</option>
                <option value="FREQ=WEEKLY">Weekly</option>
                <option value="FREQ=WEEKLY;BYDAY=MO,WE,FR">Mon/Wed/Fri</option>
                <option value="FREQ=WEEKLY;BYDAY=TU,TH">Tue/Thu</option>
                <option value="FREQ=WEEKLY;BYDAY=SA">Saturday</option>
              </select>
            </div>
          )}

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
            <select
              value={form.assigneeUserId}
              onChange={e => setForm(f => ({ ...f, assigneeUserId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Unassigned</option>
              {familyMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={3}
              placeholder="Address, packing list, details..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          {mode === 'edit' && onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
