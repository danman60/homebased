// Alerts engine for generating warnings and critical alerts

import { Alert } from '@/types/domain';
import { DatabaseClient } from '@/lib/database/client';

export class AlertsEngine {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  /**
   * Generate all alerts for a family within a date range
   */
  async generateAlerts(
    familyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Get all family data needed for alert generation
      const [tasks, users, availability] = await Promise.all([
        this.db.getTasks(familyId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        this.db.getFamilyUsers(familyId),
        this.db.getFamilyAvailability(familyId, startDate.toISOString(), endDate.toISOString())
      ]);

      // Check for missing assignments
      alerts.push(...this.checkMissingAssignments(tasks));

      // Check for missing details
      alerts.push(...this.checkMissingDetails(tasks));

      // Check for scheduling conflicts
      alerts.push(...this.checkSchedulingConflicts(tasks, availability));

      // Check for role balance
      alerts.push(...this.checkRoleBalance(tasks, users));

    } catch (error) {
      console.error('Error generating alerts:', error);
      alerts.push({
        id: 'system-error',
        type: 'critical',
        category: 'missing_assignment',
        title: 'Alert System Error',
        description: 'Unable to generate alerts. Please refresh and try again.',
        actionRequired: false,
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Check for tasks missing assignees
   */
  private checkMissingAssignments(tasks: any[]): Alert[] {
    const alerts: Alert[] = [];
    
    const unassignedTasks = tasks.filter(task => 
      task.due_date && !task.assignee_user_id
    );

    for (const task of unassignedTasks) {
      alerts.push({
        id: `missing-assignee-${task.id}`,
        type: 'warning',
        category: 'missing_assignment',
        title: 'Task needs assignment',
        description: `"${task.title}" has a due date but no assignee`,
        taskId: task.id,
        actionRequired: true,
        createdAt: new Date()
      });
    }

    // Check for dinner duty gaps
    const dinnerTasks = tasks.filter(task => 
      task.title.toLowerCase().includes('dinner') && task.type === 'cyclical'
    );
    
    if (dinnerTasks.length === 0) {
      alerts.push({
        id: 'missing-dinner-duty',
        type: 'critical',
        category: 'missing_assignment',
        title: 'No dinner duty assigned',
        description: 'No recurring dinner preparation tasks found for this week',
        actionRequired: true,
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Check for tasks missing important details
   */
  private checkMissingDetails(tasks: any[]): Alert[] {
    const alerts: Alert[] = [];

    for (const task of tasks) {
      const missingDetails: string[] = [];

      // Check for missing addresses on location-based tasks
      const locationKeywords = ['pickup', 'drop off', 'practice', 'appointment', 'school'];
      const hasLocationKeyword = locationKeywords.some(keyword => 
        task.title.toLowerCase().includes(keyword)
      );

      if (hasLocationKeyword && (!task.notes || !task.notes.includes('address'))) {
        missingDetails.push('address');
      }

      // Check for missing travel time
      if (hasLocationKeyword && (!task.notes || !task.notes.includes('leave by'))) {
        missingDetails.push('travel time');
      }

      // Check for missing packing list for activity tasks
      const activityKeywords = ['practice', 'lesson', 'game', 'party'];
      const hasActivityKeyword = activityKeywords.some(keyword => 
        task.title.toLowerCase().includes(keyword)
      );

      if (hasActivityKeyword && (!task.notes || !task.notes.includes('bring'))) {
        missingDetails.push('packing list');
      }

      if (missingDetails.length > 0) {
        alerts.push({
          id: `missing-details-${task.id}`,
          type: 'warning',
          category: 'missing_details',
          title: 'Task missing details',
          description: `"${task.title}" is missing: ${missingDetails.join(', ')}`,
          taskId: task.id,
          actionRequired: true,
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Check for scheduling conflicts
   */
  private checkSchedulingConflicts(tasks: any[], availability: any[]): Alert[] {
    const alerts: Alert[] = [];

    for (const task of tasks) {
      if (!task.due_date || !task.assignee_user_id) continue;

      const taskDate = new Date(task.due_date);
      const taskEndDate = new Date(taskDate.getTime() + 3600000); // Assume 1 hour duration

      // Check against availability blocks
      const conflictingBlocks = availability.filter(block => {
        if (block.user_id !== task.assignee_user_id) return false;

        const blockStart = new Date(block.start_time);
        const blockEnd = new Date(block.end_time);

        // Check for overlap
        return taskDate < blockEnd && taskEndDate > blockStart && block.type === 'work';
      });

      for (const block of conflictingBlocks) {
        alerts.push({
          id: `conflict-${task.id}-${block.id}`,
          type: 'warning',
          category: 'conflict',
          title: 'Schedule conflict',
          description: `"${task.title}" conflicts with ${block.type} time block`,
          taskId: task.id,
          actionRequired: true,
          createdAt: new Date()
        });
      }

      // Check for overlapping tasks (same assignee, same time)
      const overlappingTasks = tasks.filter(otherTask => {
        if (otherTask.id === task.id || otherTask.assignee_user_id !== task.assignee_user_id) {
          return false;
        }
        if (!otherTask.due_date) return false;

        const otherTaskDate = new Date(otherTask.due_date);
        const otherTaskEndDate = new Date(otherTaskDate.getTime() + 3600000);

        return taskDate < otherTaskEndDate && taskEndDate > otherTaskDate;
      });

      for (const overlappingTask of overlappingTasks) {
        alerts.push({
          id: `overlap-${task.id}-${overlappingTask.id}`,
          type: 'critical',
          category: 'conflict',
          title: 'Double booking',
          description: `"${task.title}" and "${overlappingTask.title}" are scheduled at the same time`,
          taskId: task.id,
          actionRequired: true,
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Check for role balance between parents
   */
  private checkRoleBalance(tasks: any[], users: any[]): Alert[] {
    const alerts: Alert[] = [];

    if (users.length < 2) return alerts; // Skip if single parent

    const taskCounts = users.reduce((acc: any, user: any) => {
      acc[user.id] = {
        name: user.name,
        cyclicalTasks: 0,
        projectTasks: 0,
        total: 0
      };
      return acc;
    }, {});

    // Count tasks by assignee
    for (const task of tasks) {
      if (task.assignee_user_id && taskCounts[task.assignee_user_id]) {
        taskCounts[task.assignee_user_id].total++;
        if (task.type === 'cyclical') {
          taskCounts[task.assignee_user_id].cyclicalTasks++;
        } else {
          taskCounts[task.assignee_user_id].projectTasks++;
        }
      }
    }

    const userIds = Object.keys(taskCounts);
    if (userIds.length === 2) {
      const [user1Id, user2Id] = userIds;
      const user1Count = taskCounts[user1Id].total;
      const user2Count = taskCounts[user2Id].total;

      // Check for significant imbalance (>70% difference)
      const totalTasks = user1Count + user2Count;
      if (totalTasks > 0) {
        const imbalanceThreshold = 0.7;
        const user1Percentage = user1Count / totalTasks;
        const user2Percentage = user2Count / totalTasks;

        if (user1Percentage > imbalanceThreshold || user2Percentage > imbalanceThreshold) {
          const heavierUser = user1Percentage > user2Percentage ? 
            taskCounts[user1Id].name : taskCounts[user2Id].name;
          const lighterUser = user1Percentage < user2Percentage ? 
            taskCounts[user1Id].name : taskCounts[user2Id].name;

          alerts.push({
            id: 'role-imbalance',
            type: 'warning',
            category: 'missing_assignment',
            title: 'Task load imbalance',
            description: `${heavierUser} has significantly more tasks assigned than ${lighterUser}`,
            actionRequired: false,
            createdAt: new Date()
          });
        }
      }
    }

    return alerts;
  }
}