/**
 * Focused E2E Tests: Language Switching on Upload Page
 * 
 * This focuses on the upload page where language switching is most critical
 * and avoids the complex home page setup issues.
 */

import { test, expect, type Page } from "@playwright/test";

// Simple helper to dismiss dialogs and handle auth
async function setupPage(page: Page) {
  // Block problematic requests
  await page.route('**/puter.com/**', route => route.abort());
  await page.route('**/developer.puter.com/**', route => route.abort());
  
  // Go to upload page directly
  await page.goto("/upload");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  // Handle any dialogs
  const dialogs = page.locator('puter-dialog, [role="dialog"], dialog');
  const dialogCount = await dialogs.count();
  
  for (let i = 0; i < dialogCount; i++) {
    const dialog = dialogs.nth(i);
    if (await dialog.isVisible({ timeout: 1000 })) {
      const continueBtn = dialog.locator('button:has-text("Continue")');
      if (await continueBtn.isVisible({ timeout: 500 })) {
        await continueBtn.click({ force: true });
        await page.waitForTimeout(500);
      }
    }
  }
  
  // Handle auth if needed
  const signInButton = page.getByTestId('sign-in-button');
  if (await signInButton.isVisible({ timeout: 3000 })) {
    await signInButton.click({ force: true });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Dismiss post-auth dialogs
    const postDialogs = page.locator('puter-dialog, [role="dialog"], dialog');
    const postCount = await postDialogs.count();
    for (let i = 0; i < postCount; i++) {
      const dialog = postDialogs.nth(i);
      if (await dialog.isVisible({ timeout: 500 })) {
        const continueBtn = dialog.locator('button:has-text("Continue")');
        if (await continueBtn.isVisible({ timeout: 500 })) {
          await continueBtn.click({ force: true });
          await page.waitForTimeout(300);
        }
      }
    }
    
    // Navigate back to upload page
    await page.goto("/upload");
    await page.waitForLoadState("networkidle");
  }
  
  // Final dialog cleanup with CSS
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('puter-dialog, [role="dialog"], dialog');
    dialogs.forEach(d => {
      if (d instanceof HTMLElement) {
        d.style.display = 'none';
        d.style.pointerEvents = 'none';
        d.remove();
      }
    });
  });
}

// Simple flag clicking
async function clickFlag(page: Page, flagText: string) {
  const flag = page.getByRole("button").filter({ hasText: flagText });
  await flag.waitFor({ state: 'visible', timeout: 10000 });
  
  try {
    await flag.click({ force: true });
  } catch (e) {
    // Fallback to coordinate click
    const box = await flag.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    }
  }
  
  await page.waitForTimeout(1000); // Wait for language switch to complete
}

test.describe("Upload Page Language Switching", () => {
  test("should display Vietnamese upload form by default", async ({ page }) => {
    await setupPage(page);
    
    // Check for Vietnamese text on upload page
    await expect(page.getByText("Phản hồi thông minh cho công việc mơ ước của bạn")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Tên công ty")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 5000 });
  });

  test("should switch to English on upload page", async ({ page }) => {
    await setupPage(page);
    
    // Verify we start in Vietnamese
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 10000 });
    
    // Click English flag
    await clickFlag(page, "🇺🇸");
    
    // Verify switch to English
    await expect(page.getByText("Analyze Resume")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Company Name")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Smart feedback for your dream job")).toBeVisible({ timeout: 5000 });
  });

  test("should switch back to Vietnamese from English", async ({ page }) => {
    await setupPage(page);
    
    // First switch to English
    await clickFlag(page, "🇺🇸");
    await expect(page.getByText("Analyze Resume")).toBeVisible({ timeout: 5000 });
    
    // Then switch back to Vietnamese
    await clickFlag(page, "🇻🇳");
    await expect(page.getByText("Phân tích CV")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Tên công ty")).toBeVisible({ timeout: 5000 });
  });

  test("should display correct placeholder text in different languages", async ({ page }) => {
    await setupPage(page);
    
    // Check Vietnamese placeholders
    const companyInput = page.getByRole("textbox").first();
    await expect(companyInput).toHaveAttribute("placeholder", "Tên công ty");
    
    // Switch to English
    await clickFlag(page, "🇺🇸");
    await expect(page.getByText("Analyze Resume")).toBeVisible({ timeout: 5000 });
    
    // Check English placeholders
    await expect(companyInput).toHaveAttribute("placeholder", "Company Name");
  });

  test("should maintain flag button states correctly", async ({ page }) => {
    await setupPage(page);
    
    const vietnameseFlag = page.getByRole("button").filter({ hasText: "🇻🇳" });
    const englishFlag = page.getByRole("button").filter({ hasText: "🇺🇸" });
    
    // Initial state - Vietnamese should be active
    await expect(vietnameseFlag).toHaveClass(/opacity-100/);
    await expect(englishFlag).toHaveClass(/opacity-50/);
    
    // Click English flag
    await clickFlag(page, "🇺🇸");
    
    // English should now be active
    await expect(englishFlag).toHaveClass(/opacity-100/);
    await expect(vietnameseFlag).toHaveClass(/opacity-50/);
    
    // Click Vietnamese flag
    await clickFlag(page, "🇻🇳");
    
    // Vietnamese should be active again
    await expect(vietnameseFlag).toHaveClass(/opacity-100/);
    await expect(englishFlag).toHaveClass(/opacity-50/);
  });
});