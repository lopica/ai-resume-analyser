/**
 * Basic Connectivity Test
 * 
 * Very simple test to verify Playwright can connect to the app
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Connectivity', () => {
  
  test('should connect to the application', async ({ page }) => {
    await page.goto('/');
    
    // Just verify the page loads without crashing
    await expect(page).toHaveTitle(/Resumind/);
    
    // Page should redirect to auth, so verify auth page loads
    await page.waitForURL('**/auth**', { timeout: 5000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should redirect to auth page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to auth page
    await page.waitForURL('**/auth**', { timeout: 5000 });
    await expect(page.locator('body')).toBeVisible();
    
    // Should have auth content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load auth page directly', async ({ page }) => {
    await page.goto('/auth');
    
    // Should be on auth page
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    
    // Basic auth functionality
    const signInButton = page.locator('button:has-text("Sign in")').first();
    if (await signInButton.count() > 0) {
      await expect(signInButton).toBeVisible();
    }
  });
});