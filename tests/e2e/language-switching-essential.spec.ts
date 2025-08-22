/**
 * Essential E2E Tests: Core Language Switching Functionality
 * 
 * This is a streamlined version of the language switching tests that focuses
 * on the most critical functionality while maintaining high reliability.
 */

import { test, expect, type Page } from "@playwright/test";

// Robust helper to dismiss any Puter dialogs
async function dismissPuterDialog(page: Page) {
  try {
    await page.waitForTimeout(1000);
    
    const dialogSelectors = ['puter-dialog', '[role="dialog"]', 'dialog[open]', 'dialog'];
    
    for (const selector of dialogSelectors) {
      const dialogs = page.locator(selector);
      const count = await dialogs.count();
      
      for (let i = 0; i < count; i++) {
        const dialog = dialogs.nth(i);
        if (await dialog.isVisible({ timeout: 500 })) {
          const continueBtn = dialog.locator('button:has-text("Continue")');
          if (await continueBtn.isVisible({ timeout: 500 })) {
            await continueBtn.click({ force: true });
            await page.waitForTimeout(500);
            continue;
          }
          
          const cancelBtn = dialog.locator('button:has-text("Cancel")');
          if (await cancelBtn.isVisible({ timeout: 500 })) {
            await cancelBtn.click({ force: true });
            await page.waitForTimeout(500);
            continue;
          }
          
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    }
    
    // CSS-based hiding as last resort
    await page.evaluate(() => {
      const selectors = ['puter-dialog', '[role="dialog"]', 'dialog'];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(d => {
          if (d instanceof HTMLElement) {
            d.style.display = 'none';
            d.style.visibility = 'hidden';
            d.style.pointerEvents = 'none';
            d.remove();
          }
        });
      });
    });
  } catch (e) {
    // Ignore errors
  }
}

// Simple flag clicking with multiple strategies
async function clickFlag(page: Page, flagText: string) {
  const flag = page.getByRole("button").filter({ hasText: flagText });
  await flag.waitFor({ state: 'visible', timeout: 10000 });
  
  const strategies = [
    () => flag.click({ force: true }),
    async () => {
      const box = await flag.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
      }
    },
    () => flag.evaluate(el => (el as HTMLElement).click())
  ];
  
  for (const strategy of strategies) {
    try {
      await strategy();
      await page.waitForTimeout(500);
      return;
    } catch (e) {
      await page.waitForTimeout(200);
    }
  }
}

test.describe("Essential Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    // Block external requests
    await page.route('**/puter.com/**', route => route.abort());
    await page.route('**/developer.puter.com/**', route => route.abort());
    
    // Start on upload page for reliability
    await page.goto("/upload");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Handle dialogs and authentication
    await dismissPuterDialog(page);
    
    const signInButton = page.getByTestId('sign-in-button');
    if (await signInButton.isVisible({ timeout: 3000 })) {
      await signInButton.click({ force: true });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await dismissPuterDialog(page);
      await page.goto("/upload");
      await page.waitForLoadState("networkidle");
    }
    
    // Final cleanup
    await dismissPuterDialog(page);
    await page.evaluate(() => {
      document.querySelectorAll('puter-dialog, [role="dialog"], dialog').forEach(d => d instanceof HTMLElement && d.remove());
    });
    
    // Ensure flags are visible
    const vietnameseFlag = page.getByRole("button").filter({ hasText: "🇻🇳" });
    const englishFlag = page.getByRole("button").filter({ hasText: "🇺🇸" });
    
    await vietnameseFlag.waitFor({ state: 'visible', timeout: 8000 });
    await englishFlag.waitFor({ state: 'visible', timeout: 8000 });
  });

  test("should display Vietnamese content by default", async ({ page }) => {
    await expect(page.getByText("Phản hồi thông minh cho công việc mơ ước của bạn")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Tên công ty")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 5000 });
  });

  test("should switch to English successfully", async ({ page }) => {
    // Verify starting in Vietnamese
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 10000 });
    
    // Switch to English
    await clickFlag(page, "🇺🇸");
    
    // Verify English content
    await expect(page.getByText("Analyze Resume")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Company Name")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Smart feedback for your dream job")).toBeVisible({ timeout: 5000 });
  });

  test("should switch back to Vietnamese", async ({ page }) => {
    // Switch to English first
    await clickFlag(page, "🇺🇸");
    await expect(page.getByText("Analyze Resume")).toBeVisible({ timeout: 5000 });
    
    // Switch back to Vietnamese
    await clickFlag(page, "🇻🇳");
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Tên công ty")).toBeVisible({ timeout: 5000 });
  });

  test("should update flag button states correctly", async ({ page }) => {
    const vietnameseFlag = page.getByRole("button").filter({ hasText: "🇻🇳" });
    const englishFlag = page.getByRole("button").filter({ hasText: "🇺🇸" });
    
    // Initial state - Vietnamese active
    await expect(vietnameseFlag).toHaveClass(/opacity-100/);
    await expect(englishFlag).toHaveClass(/opacity-50/);
    
    // Switch to English
    await clickFlag(page, "🇺🇸");
    await expect(englishFlag).toHaveClass(/opacity-100/);
    await expect(vietnameseFlag).toHaveClass(/opacity-50/);
    
    // Switch back to Vietnamese
    await clickFlag(page, "🇻🇳");
    await expect(vietnameseFlag).toHaveClass(/opacity-100/);
    await expect(englishFlag).toHaveClass(/opacity-50/);
  });

  test("should update form placeholders in different languages", async ({ page }) => {
    // Check Vietnamese placeholders
    const companyInput = page.getByRole("textbox").first();
    await expect(companyInput).toHaveAttribute("placeholder", "Tên công ty");
    
    // Switch to English
    await clickFlag(page, "🇺🇸");
    await expect(page.getByText("Analyze Resume")).toBeVisible({ timeout: 5000 });
    
    // Check English placeholders
    await expect(companyInput).toHaveAttribute("placeholder", "Company Name");
    
    // Switch back to Vietnamese
    await clickFlag(page, "🇻🇳");
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 5000 });
    
    // Verify Vietnamese placeholders restored
    await expect(companyInput).toHaveAttribute("placeholder", "Tên công ty");
  });

  test("should handle multiple language switches", async ({ page }) => {
    // Perform multiple switches
    for (let i = 0; i < 2; i++) {
      await clickFlag(page, "🇺🇸");
      await expect(page.getByText("Smart feedback for your dream job")).toBeVisible({ timeout: 5000 });
      
      await clickFlag(page, "🇻🇳");
      await expect(page.getByText("Phản hồi thông minh cho công việc mơ ước của bạn")).toBeVisible({ timeout: 5000 });
    }
    
    // Should end in stable Vietnamese state
    const vietnameseFlag = page.getByRole("button").filter({ hasText: "🇻🇳" });
    await expect(vietnameseFlag).toHaveClass(/opacity-100/);
  });
});