// Calendar Sync Component - Google Calendar integration controls
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Upload, Download, Settings, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SyncStatus {
  isConnected: boolean;
  lastSync?: Date;
  isLoading: boolean;
  error?: string;
  success?: string;
}

interface CalendarSyncProps {
  familyId: string;
  parentIds: string[];
  userEmail?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSyncComplete?: (result: any) => void;
}

export function CalendarSync({ familyId, parentIds, userEmail, onSyncComplete }: CalendarSyncProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    isLoading: false
  });
  
  const [autoSync, setAutoSync] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, [familyId]);

  const checkConnectionStatus = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      // Check if Google Calendar is connected for this family
      const response = await fetch(`/api/calendar/status?familyId=${familyId}`);
      const data = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        isConnected: data.isConnected,
        lastSync: data.lastSync ? new Date(data.lastSync) : undefined,
        isLoading: false
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check connection status'
      }));
    }
  };

  const handleConnectCalendar = async () => {
    try {
      // Start OAuth flow for Parent 1 (you can extend this for both parents)
      const parentId = parentIds[0];
      const parentEmail = userEmail || '';
      
      const authUrl = `/api/auth/google?familyId=${familyId}&parentId=${parentId}&parentEmail=${encodeURIComponent(parentEmail)}`;
      window.open(authUrl, '_blank', 'width=500,height=600,scrollbars=yes');
      
      // Listen for OAuth completion
      window.addEventListener('focus', checkConnectionStatus);
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        error: 'Failed to start connection process'
      }));
    }
  };

  const handlePullFromCalendar = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined, success: undefined }));
      
      const response = await fetch(`/api/calendar/sync?familyId=${familyId}&parentIds=${parentIds.join(',')}&action=pull`);
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          success: `Successfully imported ${result.eventsImported} events`,
          lastSync: new Date()
        }));
        onSyncComplete?.(result);
      } else {
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          error: `Pull failed: ${result.errors?.join(', ') || 'Unknown error'}`
        }));
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to pull from Google Calendar'
      }));
    }
  };

  const handlePushToCalendar = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined, success: undefined }));
      
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          familyId,
          parentIds,
          action: 'push'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          success: `Successfully pushed ${result.eventsCreated + result.eventsUpdated} events`,
          lastSync: new Date()
        }));
        onSyncComplete?.(result);
      } else {
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          error: `Push failed: ${result.errors?.join(', ') || 'Unknown error'}`
        }));
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to push to Google Calendar'
      }));
    }
  };

  const handleFullSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined, success: undefined }));
      
      // First pull from Google Calendar
      await handlePullFromCalendar();
      
      // Then push to Google Calendar
      setTimeout(() => {
        handlePushToCalendar();
      }, 1000);
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Full sync failed'
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Google Calendar</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {syncStatus.isConnected ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Not Connected</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {syncStatus.error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{syncStatus.error}</span>
          </div>
        </div>
      )}

      {syncStatus.success && (
        <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">{syncStatus.success}</span>
          </div>
        </div>
      )}

      {/* Last Sync Info */}
      {syncStatus.lastSync && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span>Last sync: {syncStatus.lastSync.toLocaleString()}</span>
        </div>
      )}

      {/* Connection Section */}
      {!syncStatus.isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Connect your Google Calendar to sync events between Homebase and your personal calendars.
          </p>
          <Button
            onClick={handleConnectCalendar}
            disabled={syncStatus.isLoading}
            className="w-full"
          >
            {syncStatus.isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Connect Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sync Controls */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handlePullFromCalendar}
              disabled={syncStatus.isLoading}
            >
              {syncStatus.isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Pull Events
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePushToCalendar}
              disabled={syncStatus.isLoading}
            >
              {syncStatus.isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Push Tasks
            </Button>
          </div>

          <Button
            onClick={handleFullSync}
            disabled={syncStatus.isLoading}
            className="w-full"
          >
            {syncStatus.isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Full Sync
          </Button>

          {/* Settings Panel */}
          {showSettings && (
            <div className="pt-4 border-t border-slate-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="auto-sync" className="text-sm text-slate-700">
                    Auto-sync every hour
                  </label>
                  <input
                    id="auto-sync"
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkConnectionStatus}
                  className="w-full"
                >
                  Refresh Status
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflow Description */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-2">How it works:</h4>
        <ol className="text-xs text-slate-600 space-y-1">
          <li>1. <strong>Pull Events:</strong> Import events from Parent 1 & 2 calendars</li>
          <li>2. <strong>Organize:</strong> Drag/drop events, add tasks, assign to parents</li>
          <li>3. <strong>Push Tasks:</strong> Send assigned tasks back to parent calendars</li>
        </ol>
      </div>
    </div>
  );
}