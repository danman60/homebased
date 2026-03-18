import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

const db = new DatabaseClient(supabaseServer);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId') || user?.family_id;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    if (!familyId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Family ID, start date, and end date are required' }, { status: 400 });
    }

    const availability = userId
      ? await db.getAvailabilityBlocks(userId, startDate, endDate)
      : await db.getFamilyAvailability(familyId, startDate, endDate);

    return NextResponse.json({ success: true, data: availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { block } = body;

    if (!block.startTime || !block.endTime || !block.type) {
      return NextResponse.json({ success: false, error: 'Start time, end time, and type are required' }, { status: 400 });
    }

    const newBlock = await db.createAvailabilityBlock({
      user_id: block.userId || user.id,
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
