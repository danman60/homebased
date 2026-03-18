import { NextRequest, NextResponse } from 'next/server';
import { AlertsEngine } from '@/lib/alerts/engine';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');

    if (!startDateParam) {
      return NextResponse.json({ success: false, error: 'Start date is required' }, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

    const alertsEngine = new AlertsEngine(auth.db);

    const [tasks, availability, weeklyTotalsData] = await Promise.all([
      auth.db.getTasks(auth.family_id, {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString()
      }),
      auth.db.getFamilyAvailability(auth.family_id, weekStart.toISOString(), weekEnd.toISOString()),
      auth.db.getWeeklyTotals(auth.family_id, weekStart.toISOString().split('T')[0])
    ]);

    const alerts = await alertsEngine.generateAlerts(auth.family_id, weekStart, weekEnd);

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

    const socialBlocks = [
      { id: 'social-friday', dayOfWeek: 5, startHour: 18, endHour: 22, label: 'Family/Social Time', isDefault: true },
      { id: 'social-saturday', dayOfWeek: 6, startHour: 18, endHour: 22, label: 'Family/Social Time', isDefault: true }
    ];

    return NextResponse.json({
      success: true,
      data: { startDate: weekStart, endDate: weekEnd, tasks, availabilityBlocks: availability, alerts, weeklyTotals, socialBlocks }
    });
  } catch (error) {
    console.error('Error fetching weekly view:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch weekly view' }, { status: 500 });
  }
}
