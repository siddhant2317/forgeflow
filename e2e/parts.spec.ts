import { test, expect } from '@playwright/test';

test.describe('Parts Library', () => {
  test('user creates a part and sees it in the list', async ({ page }) => {
    await page.goto('/parts');
    await expect(page.getByRole('heading', { name: 'Parts Library' })).toBeVisible();

    await page.getByRole('link', { name: '+ New Part' }).click();
    await expect(page.getByRole('heading', { name: 'New Part' })).toBeVisible();

    const partNumber = `E2E-${Date.now()}`;
    await page.getByPlaceholder(/e\.g\. M1D/).fill(partNumber);
    await page.getByPlaceholder(/Injector Valve/).fill('E2E Test Part');
    await page.getByRole('button', { name: 'Create Part' }).click();

    await expect(page).toHaveURL(/\/parts\/[a-z0-9]+$/);
    await expect(page.getByText('E2E Test Part')).toBeVisible();
    await expect(page.getByText(partNumber)).toBeVisible();

    await page.getByRole('link', { name: '← Parts' }).click();
    await expect(page).toHaveURL('/parts');
    await expect(page.getByText(partNumber)).toBeVisible();
  });

  test('user can edit a part', async ({ page }) => {
    await page.goto('/parts/new');

    const partNumber = `E2E-EDIT-${Date.now()}`;
    await page.getByPlaceholder(/e\.g\. M1D/).fill(partNumber);
    await page.getByPlaceholder(/Injector Valve/).fill('Original Name');
    await page.getByRole('button', { name: 'Create Part' }).click();

    await page.getByRole('link', { name: 'Edit' }).click();
    await page.getByPlaceholder(/Injector Valve/).clear();
    await page.getByPlaceholder(/Injector Valve/).fill('Edited Name');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Edited Name')).toBeVisible();
  });

  test('search filters parts by name', async ({ page }) => {
    await page.goto('/parts');
    const searchBox = page.getByPlaceholder(/Search by part number/);
    await searchBox.fill('ZZZNOMATCH');
    await expect(page.getByText(/No parts match/)).toBeVisible();
  });
});
