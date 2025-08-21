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
    
    // Verify there's some content on the page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display correct content on home route', async ({ page }) => {
    await page.goto('/');
    
    // Should show some main content
    await expect(page.locator('body')).toBeVisible();
    
    // Check what page we're on and verify appropriate content
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      // On auth page, check for auth elements
      await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    } else {
      // On home page, check for home elements
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=RESUMIND')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should have working navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Check what page we're on and verify appropriate navigation
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      // On auth page, just check basic functionality
      await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    } else {
      // On home page, check navigation elements
      await expect(page.locator('nav')).toBeVisible();
      
      // Should have link to upload (even if it redirects to auth)
      const uploadLink = page.locator('a[href="/upload"]').first();
      await expect(uploadLink).toBeVisible();
      
      // Should have home link/brand
      const homeLink = page.locator('a[href="/"]');
      await expect(homeLink).toBeVisible();
      
      // Should have the brand text
      await expect(page.locator('text=RESUMIND')).toBeVisible();
    }
  });
});