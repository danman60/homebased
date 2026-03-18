// Individual task API routes

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';

const db = new DatabaseClient(supabaseServer);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { updates } = body;

    const updatedTask = await db.updateTask(taskId, {
      ...(updates.title && { title: updates.title }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.dueDate !== undefined && { due_date: updates.dueDate || null }),
      ...(updates.recurrenceRule !== undefined && { recurrence_rule: updates.recurrenceRule }),
      ...(updates.assigneeUserId !== undefined && { assignee_user_id: updates.assigneeUserId }),
      ...(updates.type && { type: updates.type })
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    await db.deleteTask(taskId);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
