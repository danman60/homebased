// Weekly Stats Component - Parent time tracking summary

'use client';

import { ParentWeeklyTotals } from '@/types/domain';
import { cn } from '@/lib/utils';

interface WeeklyStatsProps {
  weeklyTotals: ParentWeeklyTotals[];
}

export function WeeklyStats({ weeklyTotals }: WeeklyStatsProps) {
  if (weeklyTotals.length === 0) {
    return (
      <div className="weekly-stats text-sm text-slate-500">
        No time tracking data
      </div>
    );
  }

  return (
    <div className="weekly-stats flex items-center gap-6">
      {weeklyTotals.map((parent, index) => (
        <div key={parent.userId} className="text-center">
          <div className="text-xs font-medium text-slate-600 mb-1">
            {parent.userName}
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {/* Work hours */}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              <span className="text-slate-700">
                {parent.workHours}h work
              </span>
            </div>
            
            {/* Childcare hours */}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-slate-700">
                {parent.childcareHours}h care
              </span>
            </div>
          </div>

          {/* Ratio indicator */}
          <div className="mt-1">
            <div className={cn(
              'text-xs px-2 py-1 rounded-full',
              parent.ratio > 2 ? 'bg-orange-100 text-orange-700' :
              parent.ratio < 0.5 ? 'bg-green-100 text-green-700' :
              'bg-slate-100 text-slate-700'
            )}>
              {parent.ratio === Infinity ? '∞' : 
               parent.ratio === 0 ? '0' : 
               `${parent.ratio.toFixed(1)}:1`} ratio
            </div>
          </div>
        </div>
      ))}

      {/* Balance indicator for two parents */}
      {weeklyTotals.length === 2 && (
        <div className="ml-4 pl-4 border-l border-slate-200">
          <BalanceIndicator totals={weeklyTotals} />
        </div>
      )}
    </div>
  );
}

function BalanceIndicator({ totals }: { totals: ParentWeeklyTotals[] }) {
  const [parent1, parent2] = totals;
  const totalHours1 = parent1.workHours + parent1.childcareHours;
  const totalHours2 = parent2.workHours + parent2.childcareHours;
  
  const difference = Math.abs(totalHours1 - totalHours2);
  const isBalanced = difference < 5; // Within 5 hours is considered balanced

  return (
    <div className="text-center">
      <div className="text-xs font-medium text-slate-600 mb-1">
        Balance
      </div>
      
      <div className={cn(
        'text-xs px-2 py-1 rounded-full',
        isBalanced ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      )}>
        {isBalanced ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Balanced
          </span>
        ) : (
          <span>{difference.toFixed(1)}h gap</span>
        )}
      </div>
    </div>
  );
}