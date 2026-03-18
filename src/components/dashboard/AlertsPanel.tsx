// Alerts Panel Component - Shows warnings and critical alerts

'use client';

import { Alert } from '@/types/domain';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertDismiss?: (alertId: string) => void;
}

export function AlertsPanel({ alerts, onAlertDismiss }: AlertsPanelProps) {
  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');

  if (alerts.length === 0) {
    return (
      <div className="alerts-panel bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-lg font-medium text-slate-900 mb-3">Alerts</h3>
        <div className="text-center py-8 text-slate-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm">All good! No alerts this week.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-panel bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-slate-900">Alerts</h3>
        <div className="flex items-center gap-2">
          {criticalAlerts.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {criticalAlerts.length} critical
            </span>
          )}
          {warningAlerts.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {warningAlerts.length} warnings
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Critical alerts first */}
        {criticalAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={onAlertDismiss}
          />
        ))}

        {/* Warning alerts */}
        {warningAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={onAlertDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function AlertCard({ 
  alert, 
  onDismiss 
}: { 
  alert: Alert; 
  onDismiss?: (alertId: string) => void 
}) {
  const getAlertIcon = () => {
    if (alert.type === 'critical') {
      return (
        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  return (
    <div className={cn(
      'alert-card border rounded-lg p-3',
      alert.type === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
    )}>
      <div className="flex items-start gap-3">
        {getAlertIcon()}
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'text-sm font-medium',
            alert.type === 'critical' ? 'text-red-900' : 'text-yellow-900'
          )}>
            {alert.title}
          </h4>
          
          <p className={cn(
            'text-sm mt-1',
            alert.type === 'critical' ? 'text-red-700' : 'text-yellow-700'
          )}>
            {alert.description}
          </p>

          {alert.actionRequired && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  'text-xs',
                  alert.type === 'critical' 
                    ? 'border-red-300 text-red-700 hover:bg-red-100' 
                    : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                )}
              >
                Take action
              </Button>
            </div>
          )}
        </div>

        {onDismiss && (
          <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6 text-slate-400 hover:text-slate-600"
            onClick={() => onDismiss(alert.id)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}