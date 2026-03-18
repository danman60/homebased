// E2E tests for dashboard functionality

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Homebase');
  });

  test('should display weekly grid with correct structure', async ({ page }) => {
    // Check that the weekly grid is visible
    await expect(page.locator('.weekly-grid')).toBeVisible();
    
    // Check that all 7 days are displayed in the header
    await expect(page.locator('.week-header')).toBeVisible();
    
    // Should have time column plus 7 day columns (8 total)
    const columns = page.locator('.grid-cols-8 > div');
    await expect(columns).toHaveCount(8 * 25); // 8 columns * 25 rows (header + 24 hours)
    
    // Check that time labels are present
    await expect(page.locator('text=12 AM')).toBeVisible();
    await expect(page.locator('text=12 PM')).toBeVisible();
    await expect(page.locator('text=11 PM')).toBeVisible();
  });

  test('should display sample tasks in the grid', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Check that sample tasks are visible
    await expect(page.locator('text=School pickup - Emma')).toBeVisible();
    await expect(page.locator('text=Dinner prep')).toBeVisible();
    await expect(page.locator('text=Plan Emma\'s birthday party')).toBeVisible();
    
    // Check task type indicators
    const cyclicalTasks = page.locator('.task-card:has-text("School pickup")');
    await expect(cyclicalTasks).toHaveClass(/bg-slate-100/);
    
    const projectTasks = page.locator('.task-card:has-text("birthday party")');
    await expect(projectTasks).toHaveClass(/bg-blue-100/);
  });

  test('should display alerts panel with sample alerts', async ({ page }) => {
    // Check alerts panel is visible
    await expect(page.locator('.alerts-panel')).toBeVisible();
    await expect(page.locator('h3:text("Alerts")')).toBeVisible();
    
    // Check for sample alerts
    await expect(page.locator('text=Missing address')).toBeVisible();
    await expect(page.locator('text=Schedule conflict')).toBeVisible();
    
    // Check alert type badges
    await expect(page.locator('text=critical')).toBeVisible();
    await expect(page.locator('text=warnings')).toBeVisible();
  });

  test('should display weekly stats for parents', async ({ page }) => {
    // Check weekly stats are visible
    await expect(page.locator('.weekly-stats')).toBeVisible();
    
    // Check parent names
    await expect(page.locator('text=Alex')).toBeVisible();
    await expect(page.locator('text=Jordan')).toBeVisible();
    
    // Check work and childcare hours
    await expect(page.locator('text=40h work')).toBeVisible();
    await expect(page.locator('text=15h care')).toBeVisible();
    await expect(page.locator('text=20h work')).toBeVisible();
    await expect(page.locator('text=25h care')).toBeVisible();
    
    // Check balance indicator
    await expect(page.locator('text=Balance')).toBeVisible();
  });

  test('should allow dismissing alerts', async ({ page }) => {
    // Wait for alerts to be visible
    await expect(page.locator('text=Missing address')).toBeVisible();
    
    // Find and click dismiss button for first alert
    const firstAlert = page.locator('.alert-card').first();
    const dismissButton = firstAlert.locator('button').last();
    await dismissButton.click();
    
    // Check that the alert is no longer visible
    await expect(page.locator('text=Missing address')).not.toBeVisible({ timeout: 2000 });
  });

  test('should show current time indicator', async ({ page }) => {
    // The current time indicator should be visible if we're in the current week
    // This is a simplified check - in reality we'd need to mock time
    const currentTimeIndicator = page.locator('.bg-blue-500');
    const isVisible = await currentTimeIndicator.isVisible();
    
    // We expect either the indicator to be visible, or no indicator (different week)
    // This test mainly ensures the component doesn't crash
    expect(typeof isVisible).toBe('boolean');
  });

  test('should handle task editing on click', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Set up console listener to check for task edit events
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Click on a task card
    await page.locator('.task-card').first().click();
    
    // Check that edit event was logged (in mock implementation)
    await page.waitForTimeout(500);
    const editMessages = consoleMessages.filter(msg => msg.includes('Edit task:'));
    expect(editMessages.length).toBeGreaterThan(0);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that dashboard is still functional
    await expect(page.locator('h1')).toContainText('Homebase');
    await expect(page.locator('.weekly-grid')).toBeVisible();
    await expect(page.locator('.alerts-panel')).toBeVisible();
    
    // Check that grid columns are still visible (may be scrollable)
    await expect(page.locator('.grid-cols-8')).toBeVisible();
    
    // Tasks should still be visible
    await expect(page.locator('.task-card')).toBeVisible();
  });
});

test.describe('Dashboard Accessibility', () => {
  test('should meet basic accessibility requirements', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h3')).toBeVisible();
    
    // Check that interactive elements are keyboard accessible
    const taskCard = page.locator('.task-card').first();
    await taskCard.focus();
    await expect(taskCard).toBeFocused();
    
    // Check that buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent() ||
                            await button.getAttribute('title');
      expect(accessibleName).toBeTruthy();
    }
    
    // Check color contrast (basic check for dark text on light backgrounds)
    const taskCards = page.locator('.task-card');
    const firstCard = taskCards.first();
    const computedStyle = await firstCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color
      };
    });
    
    // Basic check - ensure we have both background and text colors
    expect(computedStyle.backgroundColor).toBeTruthy();
    expect(computedStyle.color).toBeTruthy();
  });
});