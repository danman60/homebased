import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Start date and end date are required' }, { status: 400 });
    }

    const availability = userId
      ? await auth.db.getAvailabilityBlocks(userId, startDate, endDate)
      : await auth.db.getFamilyAvailability(auth.family_id, startDate, endDate);

    return NextResponse.json({ success: true, data: availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { block } = body;

    if (!block.startTime || !block.endTime || !block.type) {
      return NextResponse.json({ success: false, error: 'Start time, end time, and type are required' }, { status: 400 });
    }

    const newBlock = await auth.db.createAvailabilityBlock({
      user_id: block.userId || auth.id,
      start_time: block.startTime,
      end_time: block.endTime,
      type: block.type,
      is_recurring: block.isRecurring || false,
      recurrence_pattern: block.recurrencePattern || null
    });

    return NextResponse.json({ success: true, data: newBlock }, { status: 201 });
  } catch (error) {
    console.error('Error creating availability block:', error);
    return NextResponse.json({ success: false, error: 'Failed to create availability block' }, { status: 500 });
  }
}
