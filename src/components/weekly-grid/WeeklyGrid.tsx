// Weekly Grid Component - Main calendar interface

'use client';

import { useState, useCallback } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { WeeklyView, TaskWithAssignee, DragDropState, GridCell } from '@/types/domain';
import { cn } from '@/lib/utils';
import { GridTimeSlot } from './GridTimeSlot';
import { TaskCard } from './TaskCard';
import { WeekHeader } from './WeekHeader';

interface WeeklyGridProps {
  weeklyView: WeeklyView;
  onTaskDrop?: (taskId: string, newDate: Date, newHour: number, assigneeId?: string) => void;
  onTaskEdit?: (task: TaskWithAssignee) => void;
  className?: string;
}

export function WeeklyGrid({
  weeklyView,
  onTaskDrop,
  onTaskEdit,
  className
}: WeeklyGridProps) {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false
  });

  const weekStart = startOfWeek(weeklyView.startDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create grid data structure for efficient lookups
  const gridData = createGridData(weeklyView, days, hours);

  const handleDragStart = useCallback((task: TaskWithAssignee) => {
    setDragState({
      isDragging: true,
      draggedTask: task
    });
  }, []);

  const handleDragOver = useCallback((date: Date, hour: number) => {
    if (dragState.isDragging && dragState.draggedTask) {
      setDragState(prev => ({
        ...prev,
        dropTarget: { date, hour }
      }));
    }
  }, [dragState.isDragging, dragState.draggedTask]);

  const handleDragEnd = useCallback((date: Date, hour: number) => {
    if (dragState.isDragging && dragState.draggedTask) {
      onTaskDrop?.(dragState.draggedTask.id, date, hour);
      setDragState({ isDragging: false });
    }
  }, [dragState, onTaskDrop]);

  const handleDragCancel = useCallback(() => {
    setDragState({ isDragging: false });
  }, []);

  return (
    <div className={cn('weekly-grid', className)}>
      <WeekHeader 
        days={days}
        weekStart={weekStart}
      />
      
      <div className="grid-container relative overflow-auto">
        <div className="grid grid-cols-8 min-w-full">
          {/* Time column */}
          <div className="col-span-1 border-r border-slate-200">
            <div className="h-12 border-b border-slate-200" /> {/* Header spacer */}
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 flex items-center justify-end pr-2 text-sm text-slate-600 border-b border-slate-100"
              >
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div key={day.toISOString()} className="col-span-1 border-r border-slate-200">
              <div className="h-12 border-b border-slate-200" /> {/* Header spacer */}
              {hours.map(hour => {
                const cell = gridData[dayIndex][hour];
                const isCurrentTime = isToday(day) && new Date().getHours() === hour;
                const isDropTarget = dragState.dropTarget?.date.toDateString() === day.toDateString() && 
                                   dragState.dropTarget?.hour === hour;
                
                return (
                  <GridTimeSlot
                    key={`${day.toISOString()}-${hour}`}
                    date={day}
                    hour={hour}
                    cell={cell}
                    isCurrentTime={isCurrentTime}
                    isDropTarget={isDropTarget}
                    isDragging={dragState.isDragging}
                    onDragOver={() => handleDragOver(day, hour)}
                    onDragEnd={() => handleDragEnd(day, hour)}
                  >
                    {cell.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={() => handleDragStart(task)}
                        onEdit={() => onTaskEdit?.(task)}
                        isDragging={dragState.draggedTask?.id === task.id}
                      />
                    ))}
                  </GridTimeSlot>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Social blocks overlay */}
      {weeklyView.socialBlocks.map(block => (
        <SocialBlockOverlay
          key={block.id}
          block={block}
          weekStart={weekStart}
        />
      ))}

      {/* Drag overlay */}
      {dragState.isDragging && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 cursor-grabbing"
          onClick={handleDragCancel}
        />
      )}
    </div>
  );
}

// Helper function to create grid data structure
function createGridData(
  weeklyView: WeeklyView, 
  days: Date[], 
  hours: number[]
): GridCell[][] {
  const grid: GridCell[][] = days.map(day => 
    hours.map(hour => ({
      date: day,
      hour,
      tasks: [],
      hasConflict: false,
      isBlocked: false
    }))
  );

  // Place tasks in grid
  weeklyView.tasks.forEach(task => {
    if (!task.due_date) return;

    const taskDate = new Date(task.due_date);
    const dayIndex = days.findIndex(day => 
      day.toDateString() === taskDate.toDateString()
    );
    const hour = taskDate.getHours();

    if (dayIndex >= 0 && hour >= 0 && hour < 24) {
      grid[dayIndex][hour].tasks.push(task);
    }
  });

  // Mark availability and conflicts
  weeklyView.availabilityBlocks.forEach(block => {
    const startDate = new Date(block.start_time);
    const endDate = new Date(block.end_time);
    
    const startDayIndex = days.findIndex(day => 
      day.toDateString() === startDate.toDateString()
    );
    
    if (startDayIndex >= 0) {
      const startHour = startDate.getHours();
      const endHour = endDate.getHours();
      
      for (let hour = startHour; hour <= endHour && hour < 24; hour++) {
        const cell = grid[startDayIndex][hour];
        cell.availabilityType = block.type;
        
        // Mark as blocked if work time and has external conflicts
        // This would be enhanced with actual conflict detection
        cell.isBlocked = block.type === 'work' && cell.tasks.length > 0;
        
        // Mark conflicts
        cell.hasConflict = cell.tasks.length > 1;
      }
    }
  });

  return grid;
}

// Social block overlay component
function SocialBlockOverlay({ 
  block, 
  weekStart 
}: { 
  block: WeeklyView['socialBlocks'][0], 
  weekStart: Date 
}) {
  const day = addDays(weekStart, block.dayOfWeek);
  const dayIndex = block.dayOfWeek + 1; // +1 for time column
  
  const top = 48 + (block.startHour * 64); // 48px header + hour height
  const height = (block.endHour - block.startHour) * 64;
  
  return (
    <div
      className="absolute bg-blue-50 border-2 border-dashed border-blue-200 rounded-md p-2 z-10 pointer-events-none"
      style={{
        gridColumn: dayIndex + 1,
        top: `${top}px`,
        height: `${height}px`,
        left: `${(dayIndex - 1) * 12.5}%`,
        width: '12.5%'
      }}
    >
      <div className="text-xs text-blue-600 font-medium">
        {block.label}
      </div>
    </div>
  );
}