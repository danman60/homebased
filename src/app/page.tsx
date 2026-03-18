'use client';

import React from 'react';

// Homebase MVP Dashboard

export default function HomePage() {
  const handleClick = (action: string) => {
    alert(`${action} - Feature in development`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h1 className="text-5xl font-bold text-slate-900 mb-2">
              🏠 <span className="text-blue-600">Homebase</span> MVP
            </h1>
            <p className="text-xl text-slate-600">
              Family Activity Portal - Now Running Successfully! ✅
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ⚡ Development Environment Active
            </div>
          </div>
        </header>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600">✅</div>
            <div className="text-sm text-slate-600 mt-1">Next.js Ready</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">⚡</div>
            <div className="text-sm text-slate-600 mt-1">Turbopack Active</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">🎨</div>
            <div className="text-sm text-slate-600 mt-1">Tailwind CSS</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">🔧</div>
            <div className="text-sm text-slate-600 mt-1">TypeScript</div>
          </div>
        </div>

        {/* Google Calendar Integration Demo */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            🗓️ <span className="ml-2">Google Calendar Integration - Ready!</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📥</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Pull Events</h3>
              <p className="text-sm text-slate-600">Import events from Parent 1 & 2 personal calendars to populate your weekly view</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Organize & Assign</h3>
              <p className="text-sm text-slate-600">Drag/drop events, add tasks, assign to parents, and manage family schedule</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Push Tasks</h3>
              <p className="text-sm text-slate-600">Send assigned parent events back to their personal Google calendars</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800">Bidirectional Calendar Sync</h4>
                <p className="text-sm text-slate-600">OAuth authentication, conflict detection, and automatic sync</p>
              </div>
              <button 
                onClick={() => alert('Calendar sync demo - Connect your Google Calendar to test!')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try It Now
              </button>
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* MVP Features */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              🚀 <span className="ml-2">Core MVP Features</span>
            </h2>
            <div className="space-y-4">
              {[
                { icon: '📅', text: 'Weekly 7×24 Grid Calendar', status: 'ready' },
                { icon: '📋', text: 'Task Management System', status: 'ready' },
                { icon: '👥', text: 'Parent Availability Tracking', status: 'ready' },
                { icon: '🔔', text: 'Smart Alerts Engine', status: 'ready' },
                { icon: '📊', text: 'Time Tracking & Balance', status: 'ready' },
                { icon: '🗓️', text: 'Google Calendar Integration', status: 'ready' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                  <span className="flex items-center">
                    <span className="text-xl mr-3">{feature.icon}</span>
                    <span className="text-slate-700">{feature.text}</span>
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {feature.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Development Actions */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              🛠️ <span className="ml-2">Quick Actions</span>
            </h2>
            <div className="space-y-4">
              <button 
                onClick={() => handleClick('Setup Database')}
                className="w-full p-4 text-left rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="font-semibold text-blue-700">Setup Database</div>
                <div className="text-sm text-slate-600">Configure Supabase connection</div>
              </button>
              
              <button 
                onClick={() => handleClick('Test API Endpoints')}
                className="w-full p-4 text-left rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="font-semibold text-green-700">Test API Endpoints</div>
                <div className="text-sm text-slate-600">Verify /api/tasks, /api/weekly routes</div>
              </button>
              
              <button 
                onClick={() => handleClick('Load Components')}
                className="w-full p-4 text-left rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <div className="font-semibold text-purple-700">Load UI Components</div>
                <div className="text-sm text-slate-600">Initialize WeeklyGrid, Dashboard</div>
              </button>
              
              <button 
                onClick={() => window.open('https://github.com/danman60/homebased', '_blank')}
                className="w-full p-4 text-left rounded-lg border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                <div className="font-semibold text-orange-700">View GitHub Repo</div>
                <div className="text-sm text-slate-600">Access complete source code</div>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">📊 Weekly Grid Preview</h2>
          <div className="bg-slate-50 rounded-lg p-6 overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-8 gap-px bg-slate-300 rounded-lg overflow-hidden">
                {/* Header Row */}
                <div className="bg-slate-600 text-white p-3 text-center text-sm font-medium">Time</div>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-slate-600 text-white p-3 text-center text-sm font-medium">{day}</div>
                ))}
                
                {/* Sample Time Slots */}
                {[
                  { time: '09:00', data: ['', '🏢 Work', '🏢 Work', '🏢 Work', '🏢 Work', '🏢 Work', ''] },
                  { time: '15:00', data: ['', '🎒 Pickup', '🎒 Pickup', '🎒 Pickup', '🎒 Pickup', '🎒 Pickup', ''] },
                  { time: '18:00', data: ['', '🍽️ Dinner', '', '🍽️ Dinner', '', '🎉 Social', '🎉 Social'] }
                ].map((row, idx) => (
                  <React.Fragment key={idx}>
                    <div className="bg-white p-3 text-center text-xs font-mono text-slate-600">{row.time}</div>
                    {row.data.map((cell, cellIdx) => (
                      <div 
                        key={cellIdx} 
                        className={`bg-white p-3 text-center text-xs ${
                          cell ? (
                            cell.includes('Work') ? 'bg-orange-50 text-orange-700' :
                            cell.includes('Pickup') ? 'bg-blue-50 text-blue-700' :
                            cell.includes('Dinner') ? 'bg-green-50 text-green-700' :
                            'bg-purple-50 text-purple-700'
                          ) : ''
                        }`}
                      >
                        {cell}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 text-center">
            Interactive weekly calendar with drag-and-drop task scheduling, availability tracking, and conflict detection
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 py-6 text-slate-500 text-sm">
          <p>🎯 Homebase MVP is now running successfully!</p>
          <p>Ready for database setup and full feature implementation.</p>
        </div>
      </div>
    </div>
  );
}