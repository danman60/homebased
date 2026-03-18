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
    const type = searchParams.get('type') as 'cyclical' | 'project' | null;
    const assigneeId = searchParams.get('assigneeId');

    if (!familyId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const tasks = await db.getTasks(familyId, {
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(type && { type }),
      ...(assigneeId && { assigneeId })
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { task } = body;

    if (!task.title || !task.type) {
      return NextResponse.json({ success: false, error: 'Title and type are required' }, { status: 400 });
    }

    const newTask = await db.createTask({
      family_id: user.family_id,
      title: task.title,
      notes: task.notes || null,
      due_date: task.dueDate || null,
      recurrence_rule: task.recurrenceRule || null,
      assignee_user_id: task.assigneeUserId || null,
      type: task.type
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}
