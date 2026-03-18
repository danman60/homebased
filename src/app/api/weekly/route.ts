// Weekly view API route

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';
import { AlertsEngine } from '@/lib/alerts/engine';
import { startOfWeek, endOfWeek } from 'date-fns';

const db = new DatabaseClient(supabaseServer);
const alertsEngine = new AlertsEngine(db);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const startDateParam = searchParams.get('startDate');

    if (!familyId || !startDateParam) {
      return NextResponse.json(
        { success: false, error: 'Family ID and start date are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

    // Fetch all weekly data in parallel
    const [tasks, availability, weeklyTotalsData] = await Promise.all([
      db.getTasks(familyId, {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString()
      }),
      db.getFamilyAvailability(
        familyId,
        weekStart.toISOString(),
        weekEnd.toISOString()
      ),
      db.getWeeklyTotals(familyId, weekStart.toISOString().split('T')[0])
    ]);

    // Generate alerts
    const alerts = await alertsEngine.generateAlerts(familyId, weekStart, weekEnd);

    // Transform weekly totals data
    const weeklyTotals = weeklyTotalsData.map(total => ({
      userId: total.user_id,
      userName: total.user?.name ?? 'Unknown',
      workHours: Math.round(total.work_minutes / 60 * 100) / 100,
      childcareHours: Math.round(total.childcare_minutes / 60 * 100) / 100,
      totalHours: Math.round((total.work_minutes + total.childcare_minutes) / 60 * 100) / 100,
      ratio: total.childcare_minutes > 0
        ? Math.round(total.work_minutes / total.childcare_minutes * 100) / 100
        : total.work_minutes > 0 ? Infinity : 0
    }));

    // Default social blocks (Friday/Saturday evenings)
    const socialBlocks = [
      {
        id: 'social-friday',
        dayOfWeek: 5,
        startHour: 18,
        endHour: 22,
        label: 'Family/Social Time',
        isDefault: true
      },
      {
        id: 'social-saturday',
        dayOfWeek: 6,
        startHour: 18,
        endHour: 22,
        label: 'Family/Social Time',
        isDefault: true
      }
    ];

    const weeklyView = {
      startDate: weekStart,
      endDate: weekEnd,
      tasks,
      availabilityBlocks: availability,
      alerts,
      weeklyTotals,
      socialBlocks
    };

    return NextResponse.json({ success: true, data: weeklyView });
  } catch (error) {
    console.error('Error fetching weekly view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weekly view' },
      { status: 500 }
    );
  }
}
