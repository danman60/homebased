// Tasks API routes

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient, supabaseServer } from '@/lib/database/client';

const db = new DatabaseClient(supabaseServer);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') as 'cyclical' | 'project' | null;
    const assigneeId = searchParams.get('assigneeId');

    if (!familyId) {
      return NextResponse.json(
        { success: false, error: 'Family ID is required' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task } = body;

    if (!task.title || !task.type) {
      return NextResponse.json(
        { success: false, error: 'Title and type are required' },
        { status: 400 }
      );
    }

    // TODO: Get family ID from auth context (Phase 1)
    const familyId = 'f1234567-89ab-cdef-0123-456789abcdef';

    const newTask = await db.createTask({
      family_id: familyId,
      title: task.title,
      notes: task.notes || null,
      due_date: task.dueDate || null,
      recurrence_rule: task.recurrenceRule || null,
      assignee_user_id: task.assigneeUserId || null,
      type: task.type
    });

    return NextResponse.json(
      { success: true, data: newTask, message: 'Task created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
