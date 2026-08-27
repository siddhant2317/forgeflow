import { test, expect } from '@playwright/test';

test.describe('Work Orders', () => {
  test('full flow: create part → create work order → complete steps → confirm COMPLETE', async ({
    page,
  }) => {
    await page.goto('/parts/new');
    const pn = `WO-PART-${Date.now()}`;
    await page.getByPlaceholder(/e\.g\. M1D/).fill(pn);
    await page.getByPlaceholder(/Injector Valve/).fill('WO Test Part');
    await page.getByRole('button', { name: 'Create Part' }).click();
    await page.waitForURL(/\/parts\/[a-z0-9]+$/);

    await page.goto('/work-orders');
    await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();

    await page.getByRole('button', { name: '+ New Work Order' }).click();

    await page.getByPlaceholder(/Assemble Merlin/).fill('E2E Assemble Test');

    const partSelect = page.locator('select').first();
    await partSelect.selectOption({ label: new RegExp(pn) });

    await page.getByPlaceholder(/Inspect components/).fill('Inspect\nAssemble\nVerify');

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('E2E Assemble Test')).toBeVisible({ timeout: 10000 });

    await page.getByText('E2E Assemble Test').click();
    await expect(page).toHaveURL(/\/work-orders\/[a-z0-9]+$/);

    await page.getByRole('heading', { name: 'E2E Assemble Test' }).waitFor();

    const checkboxes = page.locator('button').filter({ hasText: '' }).nth(0);
    const allStepButtons = page.locator('ul li button');
    const count = await allStepButtons.count();
    for (let i = 0; i < count; i++) {
      await allStepButtons.nth(0).click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText('COMPLETE')).toBeVisible({ timeout: 10000 });
  });
});
