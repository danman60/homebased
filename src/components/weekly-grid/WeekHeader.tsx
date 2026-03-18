// Week Header Component - Days of week header for grid

'use client';

import { format, isToday, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekHeaderProps {
  days: Date[];
  weekStart: Date;
}

export function WeekHeader({ days }: WeekHeaderProps) {
  return (
    <div className="week-header grid grid-cols-8 border-b border-slate-300 bg-slate-50">
      {/* Time column header */}
      <div className="col-span-1 h-12 flex items-center justify-center border-r border-slate-200">
        <div className="text-sm font-medium text-slate-600">Time</div>
      </div>

      {/* Day headers */}
      {days.map((day) => (
        <div 
          key={day.toISOString()}
          className={cn(
            'col-span-1 h-12 flex flex-col items-center justify-center border-r border-slate-200',
            isToday(day) && 'bg-blue-100 text-blue-800',
            isWeekend(day) && !isToday(day) && 'bg-slate-100'
          )}
        >
          {/* Day name */}
          <div className={cn(
            'text-sm font-medium',
            isToday(day) ? 'text-blue-800' : 'text-slate-700'
          )}>
            {format(day, 'EEE')}
          </div>
          
          {/* Date */}
          <div className={cn(
            'text-xs',
            isToday(day) ? 'text-blue-600' : 'text-slate-500'
          )}>
            {format(day, 'MMM d')}
          </div>

          {/* Today indicator */}
          {isToday(day) && (
            <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
          )}
        </div>
      ))}
    </div>
  );
}