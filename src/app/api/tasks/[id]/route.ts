import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { id: taskId } = await params;
    const body = await request.json();
    const { updates } = body;

    const updatedTask = await auth.db.updateTask(taskId, {
      ...(updates.title && { title: updates.title }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.dueDate !== undefined && { due_date: updates.dueDate || null }),
      ...(updates.recurrenceRule !== undefined && { recurrence_rule: updates.recurrenceRule }),
      ...(updates.assigneeUserId !== undefined && { assignee_user_id: updates.assigneeUserId }),
      ...(updates.type && { type: updates.type })
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const { id: taskId } = await params;
    await auth.db.deleteTask(taskId);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
