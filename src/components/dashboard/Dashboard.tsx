// Dashboard Component - Main weekly view with alerts and stats

'use client';

import { WeeklyView } from '@/types/domain';
import { WeeklyGrid } from '@/components/weekly-grid';
import { AlertsPanel } from './AlertsPanel';
import { WeeklyStats } from './WeeklyStats';
import { CalendarSync } from './CalendarSync';
import { format } from 'date-fns';

interface DashboardProps {
  weeklyView: WeeklyView;
  familyId: string;
  parentIds: string[];
  onTaskDrop?: (taskId: string, newDate: Date, newHour: number, assigneeId?: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onAlertDismiss?: (alertId: string) => void;
  onCalendarSync?: (result: any) => void;
}

export function Dashboard({
  weeklyView,
  familyId,
  parentIds,
  onTaskDrop,
  onTaskEdit,
  onAlertDismiss,
  onCalendarSync
}: DashboardProps) {
  return (
    <div className="dashboard min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Homebase
            </h1>
            <p className="text-sm text-slate-600">
              Week of {format(weeklyView.startDate, 'MMM d')} - {format(weeklyView.endDate, 'MMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <WeeklyStats weeklyTotals={weeklyView.weeklyTotals} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {/* Sidebar with alerts and calendar sync */}
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
          <CalendarSync
            familyId={familyId}
            parentIds={parentIds}
            onSyncComplete={onCalendarSync}
          />
          
          <AlertsPanel 
            alerts={weeklyView.alerts}
            onAlertDismiss={onAlertDismiss}
          />
        </div>

        {/* Weekly grid */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <WeeklyGrid
              weeklyView={weeklyView}
              onTaskDrop={onTaskDrop}
              onTaskEdit={(task) => onTaskEdit?.(task.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}