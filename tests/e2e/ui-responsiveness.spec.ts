/**
 * Simple UI Responsiveness Tests
 */

import { test, expect } from '@playwright/test';

test.describe('UI Responsiveness', () => {
  
  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/auth');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/auth');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load page content quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
    const loadTime = Date.now() - start;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

});