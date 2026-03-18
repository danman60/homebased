// Task Card Component - Individual task display in grid

'use client';

import { TaskWithAssignee } from '@/types/domain';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: TaskWithAssignee;
  onDragStart: () => void;
  onEdit: () => void;
  isDragging: boolean;
}

export function TaskCard({
  task,
  onDragStart,
  onEdit,
  isDragging
}: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart();
    // Set drag data for native drag/drop compatibility
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getTaskTypeStyles = () => {
    if (task.type === 'cyclical') {
      return {
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-700'
      };
    } else {
      return {
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800'
      };
    }
  };

  const getAssigneeColor = () => {
    if (!task.assignee) return 'bg-gray-200';
    
    // Simple color assignment based on assignee ID
    const colors = [
      'bg-pink-200',
      'bg-green-200',
      'bg-yellow-200',
      'bg-purple-200',
      'bg-indigo-200'
    ];
    
    const colorIndex = task.assignee.id.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  const styles = getTaskTypeStyles();

  return (
    <div
      className={cn(
        'task-card relative rounded-md border p-2 mb-1 text-xs cursor-grab transition-all',
        styles.bg,
        styles.border,
        styles.text,
        isDragging && 'opacity-50 transform rotate-2 scale-105 cursor-grabbing',
        !isDragging && 'hover:shadow-md hover:-translate-y-0.5'
      )}
      draggable
      onDragStart={handleDragStart}
      onClick={onEdit}
    >
      {/* Task title */}
      <div className="font-medium truncate mb-1">
        {task.title}
      </div>

      {/* Task metadata */}
      <div className="flex items-center justify-between text-xs opacity-75">
        {/* Due time */}
        {task.due_date && (
          <div>
            {format(new Date(task.due_date), 'h:mm a')}
          </div>
        )}

        {/* Assignee indicator */}
        {task.assignee && (
          <div className="flex items-center gap-1">
            <div 
              className={cn(
                'w-3 h-3 rounded-full',
                getAssigneeColor()
              )}
              title={task.assignee.name}
            />
            <span className="hidden sm:inline truncate max-w-16">
              {task.assignee.name}
            </span>
          </div>
        )}
      </div>

      {/* Task type indicator */}
      <div className="absolute top-1 right-1">
        {task.type === 'cyclical' ? (
          <div 
            className="w-2 h-2 rounded-full bg-slate-400"
            title="Recurring task"
          />
        ) : (
          <div 
            className="w-2 h-2 bg-blue-500"
            title="Project task"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          />
        )}
      </div>

      {/* Notes indicator */}
      {task.notes && (
        <div className="absolute bottom-1 right-1 w-2 h-2">
          <div className="w-full h-full bg-gray-400 rounded-full opacity-60" />
        </div>
      )}

      {/* Recurrence indicator */}
      {task.recurrence_rule && (
        <div className="absolute top-1 left-1 text-slate-500">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      )}
    </div>
  );
}