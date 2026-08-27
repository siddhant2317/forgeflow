import { test, expect } from '@playwright/test';

test.describe('BOM Tree', () => {
  test('user navigates to a part and expands its BOM tree', async ({ page }) => {
    await page.goto('/parts/new');
    const parentPN = `BOM-PARENT-${Date.now()}`;
    await page.getByPlaceholder(/e\.g\. M1D/).fill(parentPN);
    await page.getByPlaceholder(/Injector Valve/).fill('Parent Part');
    await page.getByRole('button', { name: 'Create Part' }).click();
    await page.waitForURL(/\/parts\/[a-z0-9]+$/);

    await page.getByRole('link', { name: 'View BOM tree →' }).click();
    await expect(page.getByRole('heading', { name: 'Bill of Materials' })).toBeVisible();
    await expect(page.getByText(parentPN)).toBeVisible();
  });
});
