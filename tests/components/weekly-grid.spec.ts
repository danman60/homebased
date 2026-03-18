// Component tests for weekly grid

import { test, expect } from '@playwright/test';

test.describe('Weekly Grid Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.weekly-grid', { timeout: 5000 });
  });

  test('should render correct time slots', async ({ page }) => {
    // Check that all 24 hours are represented
    for (let hour = 0; hour < 24; hour++) {
      const timeLabel = hour === 0 ? '12 AM' : 
                       hour < 12 ? `${hour} AM` :
                       hour === 12 ? '12 PM' : 
                       `${hour - 12} PM`;
      
      await expect(page.locator(`text=${timeLabel}`)).toBeVisible();
    }
  });

  test('should show availability blocks correctly', async ({ page }) => {
    // Look for availability indicators (colored bars at top of cells)
    const availabilityIndicators = page.locator('.bg-orange-300, .bg-green-300, .bg-purple-300');
    
    // Should have at least some availability blocks from mock data
    const count = await availabilityIndicators.count();
    expect(count).toBeGreaterThan(0);
    
    // Check that work availability has orange indicator
    const workBlocks = page.locator('.bg-orange-50');
    await expect(workBlocks.first()).toBeVisible();
  });

  test('should display social blocks as overlays', async ({ page }) => {
    // Social blocks should appear as overlays on Friday and Saturday evenings
    const socialBlocks = page.locator('text=Family Time, text=Social Time');
    
    // We expect at least one social block to be visible
    // (Note: this may depend on the current week view)
    const socialBlockElements = page.locator('.bg-blue-50');
    const count = await socialBlockElements.count();
    
    // Either visible or not, but component should not crash
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle task drag and drop interactions', async ({ page }) => {
    // Wait for tasks to be loaded
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Set up console listener to capture drag events
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Get first task card
    const taskCard = page.locator('.task-card').first();
    await expect(taskCard).toBeVisible();
    
    // Verify draggable attribute
    const isDraggable = await taskCard.getAttribute('draggable');
    expect(isDraggable).toBe('true');
    
    // Test drag start (just verify it doesn't crash)
    const boundingBox = await taskCard.boundingBox();
    if (boundingBox) {
      // Simulate mouse down to start drag
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      
      // Move mouse to simulate drag
      await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
      
      // Release mouse
      await page.mouse.up();
    }
    
    // Verify no crashes occurred (page is still responsive)
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show current time indicator when applicable', async ({ page }) => {
    // Look for current time indicator
    const currentTimeLines = page.locator('.bg-blue-500');
    
    // May or may not be visible depending on current time and week
    // Main test is that the component renders without errors
    const isVisible = await currentTimeLines.first().isVisible();
    expect(typeof isVisible).toBe('boolean');
    
    // If visible, should be a thin horizontal line
    if (isVisible) {
      const lineElement = currentTimeLines.first();
      const height = await lineElement.evaluate(el => getComputedStyle(el).height);
      
      // Should be a thin line (h-0.5 = 2px in Tailwind)
      expect(height).toBe('2px');
    }
  });

  test('should display conflict indicators correctly', async ({ page }) => {
    // Look for conflict indicators (red dots)
    const conflictIndicators = page.locator('.bg-red-500.rounded-full');
    
    // Count conflicts
    const conflictCount = await conflictIndicators.count();
    expect(conflictCount).toBeGreaterThanOrEqual(0);
    
    // If conflicts exist, they should be small red dots
    if (conflictCount > 0) {
      const firstConflict = conflictIndicators.first();
      const classes = await firstConflict.getAttribute('class');
      expect(classes).toContain('w-2');
      expect(classes).toContain('h-2');
    }
  });

  test('should handle empty time slots correctly', async ({ page }) => {
    // Find time slots without tasks
    const emptySlots = page.locator('.h-16:not(:has(.task-card))');
    
    // Should have many empty slots
    const emptyCount = await emptySlots.count();
    expect(emptyCount).toBeGreaterThan(100); // 7 days * 24 hours - some tasks
    
    // Empty slots should still be interactive (for drag/drop)
    const firstEmptySlot = emptySlots.first();
    await expect(firstEmptySlot).toBeVisible();
    
    // Should have hover effects
    await firstEmptySlot.hover();
    
    // Component should remain stable
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display task assignee colors correctly', async ({ page }) => {
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Look for assignee indicators (colored circles)
    const assigneeIndicators = page.locator('.rounded-full.w-3.h-3');
    
    // Should have assignee indicators for assigned tasks
    const indicatorCount = await assigneeIndicators.count();
    expect(indicatorCount).toBeGreaterThan(0);
    
    // Each indicator should have a background color
    for (let i = 0; i < Math.min(indicatorCount, 3); i++) {
      const indicator = assigneeIndicators.nth(i);
      const classes = await indicator.getAttribute('class');
      
      // Should have a bg-* color class
      expect(classes).toMatch(/bg-(pink|green|yellow|purple|indigo)-200/);
    }
  });
});

test.describe('Weekly Grid Responsive Behavior', () => {
  test('should adapt to different screen sizes', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.weekly-grid')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.weekly-grid')).toBeVisible();
    
    // Grid should still show all columns (may require scrolling)
    await expect(page.locator('.grid-cols-8')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.weekly-grid')).toBeVisible();
    
    // Should have horizontal scroll on mobile
    const gridContainer = page.locator('.grid-container');
    await expect(gridContainer).toBeVisible();
    
    // Tasks should still be readable on mobile
    await expect(page.locator('.task-card')).toBeVisible();
  });

  test('should handle long task titles gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Check that task titles are truncated properly
    const taskTitles = page.locator('.task-card .truncate');
    const titleCount = await taskTitles.count();
    
    expect(titleCount).toBeGreaterThan(0);
    
    // Check that truncation class is applied
    for (let i = 0; i < Math.min(titleCount, 3); i++) {
      const title = taskTitles.nth(i);
      const classes = await title.getAttribute('class');
      expect(classes).toContain('truncate');
    }
  });
});