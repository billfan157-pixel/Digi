import { test, expect } from '@playwright/test';

test.describe('App smoke tests', () => {
  test('home page renders and shows DigiWell branding', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login or show app — check for key elements
    await expect(
      page.locator('h1, [class*="logo"], [class*="brand"]')
    ).toBeVisible({ timeout: 15000 });
  });

  test('app has valid title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
