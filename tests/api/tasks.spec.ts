// API tests for task endpoints

import { test, expect } from '@playwright/test';

test.describe('Tasks API', () => {
  const baseURL = 'http://localhost:3000';

  test('GET /api/tasks should return tasks for family', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tasks?familyId=test-family-id`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('GET /api/tasks should require familyId parameter', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tasks`);
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Family ID is required');
  });

  test('GET /api/tasks should filter by date range', async ({ request }) => {
    const startDate = '2024-01-01T00:00:00Z';
    const endDate = '2024-01-07T23:59:59Z';
    
    const response = await request.get(
      `${baseURL}/api/tasks?familyId=test-family-id&startDate=${startDate}&endDate=${endDate}`
    );
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('GET /api/tasks should filter by task type', async ({ request }) => {
    const response = await request.get(
      `${baseURL}/api/tasks?familyId=test-family-id&type=cyclical`
    );
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /api/tasks should create a new task', async ({ request }) => {
    const newTask = {
      task: {
        title: 'Test Task',
        notes: 'This is a test task',
        type: 'cyclical',
        dueDate: new Date('2024-01-15T10:00:00Z'),
        assigneeUserId: 'test-user-id'
      }
    };

    const response = await request.post(`${baseURL}/api/tasks`, {
      data: newTask
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.title).toBe(newTask.task.title);
    expect(data.data.type).toBe(newTask.task.type);
    expect(data.message).toBe('Task created successfully');
  });

  test('POST /api/tasks should validate required fields', async ({ request }) => {
    const invalidTask = {
      task: {
        notes: 'Missing title and type'
      }
    };

    const response = await request.post(`${baseURL}/api/tasks`, {
      data: invalidTask
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Title and type are required');
    expect(data.validationErrors).toBeDefined();
    expect(Array.isArray(data.validationErrors)).toBe(true);
  });
});

test.describe('Individual Task API', () => {
  const baseURL = 'http://localhost:3000';

  test('PUT /api/tasks/[id] should update task', async ({ request }) => {
    const taskId = 'test-task-id';
    const updates = {
      updates: {
        title: 'Updated Task Title',
        notes: 'Updated notes'
      }
    };

    const response = await request.put(`${baseURL}/api/tasks/${taskId}`, {
      data: updates
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.message).toBe('Task updated successfully');
  });

  test('DELETE /api/tasks/[id] should delete task', async ({ request }) => {
    const taskId = 'test-task-id';

    const response = await request.delete(`${baseURL}/api/tasks/${taskId}`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.deleted).toBe(true);
    expect(data.message).toBe('Task deleted successfully');
  });
});

test.describe('Weekly View API', () => {
  const baseURL = 'http://localhost:3000';

  test('GET /api/weekly should return complete weekly view', async ({ request }) => {
    const familyId = 'test-family-id';
    const startDate = '2024-01-07'; // Sunday

    const response = await request.get(
      `${baseURL}/api/weekly?familyId=${familyId}&startDate=${startDate}`
    );
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('startDate');
    expect(data.data).toHaveProperty('endDate');
    expect(data.data).toHaveProperty('tasks');
    expect(data.data).toHaveProperty('availabilityBlocks');
    expect(data.data).toHaveProperty('alerts');
    expect(data.data).toHaveProperty('weeklyTotals');
    expect(data.data).toHaveProperty('socialBlocks');
    
    // Validate data types
    expect(Array.isArray(data.data.tasks)).toBe(true);
    expect(Array.isArray(data.data.availabilityBlocks)).toBe(true);
    expect(Array.isArray(data.data.alerts)).toBe(true);
    expect(Array.isArray(data.data.weeklyTotals)).toBe(true);
    expect(Array.isArray(data.data.socialBlocks)).toBe(true);
  });

  test('GET /api/weekly should require familyId and startDate', async ({ request }) => {
    // Missing familyId
    const response1 = await request.get(`${baseURL}/api/weekly?startDate=2024-01-07`);
    expect(response1.status()).toBe(400);
    
    // Missing startDate
    const response2 = await request.get(`${baseURL}/api/weekly?familyId=test-family`);
    expect(response2.status()).toBe(400);
    
    // Both missing
    const response3 = await request.get(`${baseURL}/api/weekly`);
    expect(response3.status()).toBe(400);
  });
});

test.describe('Availability API', () => {
  const baseURL = 'http://localhost:3000';

  test('GET /api/availability should return availability blocks', async ({ request }) => {
    const familyId = 'test-family-id';
    const startDate = '2024-01-07T00:00:00Z';
    const endDate = '2024-01-13T23:59:59Z';

    const response = await request.get(
      `${baseURL}/api/availability?familyId=${familyId}&startDate=${startDate}&endDate=${endDate}`
    );
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /api/availability should create availability block', async ({ request }) => {
    const newBlock = {
      block: {
        userId: 'test-user-id',
        startTime: '2024-01-08T09:00:00Z',
        endTime: '2024-01-08T17:00:00Z',
        type: 'work',
        isRecurring: true,
        recurrencePattern: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
      }
    };

    const response = await request.post(`${baseURL}/api/availability`, {
      data: newBlock
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.type).toBe('work');
    expect(data.message).toBe('Availability block created successfully');
  });
});