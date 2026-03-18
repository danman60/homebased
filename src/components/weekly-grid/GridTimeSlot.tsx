// Grid Time Slot Component - Individual hour cells in the weekly grid

'use client';

import { ReactNode } from 'react';
import { GridCell } from '@/types/domain';
import { cn } from '@/lib/utils';

interface GridTimeSlotProps {
  date: Date;
  hour: number;
  cell: GridCell;
  isCurrentTime: boolean;
  isDropTarget: boolean;
  isDragging: boolean;
  onDragOver: () => void;
  onDragEnd: () => void;
  children: ReactNode;
}

export function GridTimeSlot({
  date,
  hour,
  cell,
  isCurrentTime,
  isDropTarget,
  isDragging,
  onDragOver,
  onDragEnd,
  children
}: GridTimeSlotProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnd();
  };

  return (
    <div
      className={cn(
        'relative h-16 border-b border-slate-100 p-1 transition-colors',
        // Current time highlighting
        isCurrentTime && 'bg-blue-50 ring-2 ring-blue-200',
        
        // Availability type styling
        cell.availabilityType === 'work' && 'bg-orange-50',
        cell.availabilityType === 'childcare' && 'bg-green-50',
        cell.availabilityType === 'personal' && 'bg-purple-50',
        
        // Conflict and blocking states
        cell.hasConflict && 'bg-red-50 ring-1 ring-red-200',
        cell.isBlocked && 'bg-gray-100 cursor-not-allowed',
        
        // Drag and drop states
        isDragging && !cell.isBlocked && 'hover:bg-blue-100 cursor-copy',
        isDropTarget && 'bg-blue-200 ring-2 ring-blue-400',
        
        // Default hover
        !isDragging && !cell.isBlocked && 'hover:bg-slate-50'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-hour={hour}
      data-date={date.toISOString()}
    >
      {/* Availability indicator */}
      {cell.availabilityType && (
        <div className={cn(
          'absolute top-0 left-0 w-full h-1',
          cell.availabilityType === 'work' && 'bg-orange-300',
          cell.availabilityType === 'childcare' && 'bg-green-300',
          cell.availabilityType === 'personal' && 'bg-purple-300'
        )} />
      )}

      {/* Conflict indicator */}
      {cell.hasConflict && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Blocked indicator */}
      {cell.isBlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-xs">Blocked</div>
        </div>
      )}

      {/* Current time line */}
      {isCurrentTime && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 z-20" />
      )}

      {/* Task content */}
      <div className="relative z-10 h-full">
        {children}
      </div>

      {/* Drop target overlay */}
      {isDropTarget && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded bg-blue-100/50 flex items-center justify-center">
          <div className="text-blue-600 text-xs font-medium">Drop here</div>
        </div>
      )}
    </div>
  );
}