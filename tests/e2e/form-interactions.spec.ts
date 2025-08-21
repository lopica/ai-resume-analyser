/**
 * Simple Form Interaction Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Form Interactions', () => {
  
  test('should navigate to upload page', async ({ page }) => {
    await page.goto('/upload');
    
    // Should redirect to auth or show upload page
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle auth page interactions', async ({ page }) => {
    await page.goto('/auth');
    
    // Should have auth page content
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for sign in elements
    const signInButton = page.locator('button').first();
    if (await signInButton.count() > 0) {
      await expect(signInButton).toBeVisible();
    }
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to auth
    await page.waitForURL('**/auth**', { timeout: 5000 });
    await expect(page.locator('body')).toBeVisible();
    
    // Try navigating to upload
    await page.goto('/upload');
    await expect(page.locator('body')).toBeVisible();
  });

});