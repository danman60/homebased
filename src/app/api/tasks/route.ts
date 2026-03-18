import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') as 'cyclical' | 'project' | null;
    const assigneeId = searchParams.get('assigneeId');

    const tasks = await auth.db.getTasks(auth.family_id, {
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
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { task } = body;

    if (!task.title || !task.type) {
      return NextResponse.json({ success: false, error: 'Title and type are required' }, { status: 400 });
    }

    const newTask = await auth.db.createTask({
      family_id: auth.family_id,
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
