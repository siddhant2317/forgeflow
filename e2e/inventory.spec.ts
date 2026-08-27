import { test, expect } from '@playwright/test';

test.describe('Inventory', () => {
  test('user adds inventory item and it appears in the table', async ({ page }) => {
    await page.goto('/parts/new');
    const pn = `INV-PART-${Date.now()}`;
    await page.getByPlaceholder(/e\.g\. M1D/).fill(pn);
    await page.getByPlaceholder(/Injector Valve/).fill('Inventory Test Part');
    await page.getByRole('button', { name: 'Create Part' }).click();
    await page.waitForURL(/\/parts\/[a-z0-9]+$/);

    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    await page.getByRole('button', { name: '+ Add Item' }).click();

    const partSelect = page.locator('select').first();
    await partSelect.selectOption({ label: new RegExp(pn) });

    await page.getByPlaceholder(/e\.g\. Rack/).fill('Rack B-2');

    const qtyInput = page.locator('input[type="number"]');
    await qtyInput.fill('25');

    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Rack B-2')).toBeVisible();
  });
});
