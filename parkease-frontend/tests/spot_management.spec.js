import { test, expect } from '@playwright/test';

test.describe('Manager Spot Management', () => {
  const uniqueId = Date.now();
  
  // NOTE: This test assumes you have at least one APPROVED lot.
  // In a real E2E run, you would run manager_flow, then admin_flow, then this.
  const managerCredentials = {
    email: 'manager@example.com', // Update with a real manager account
    password: 'Password123!'
  };

  test('should bulk create spots for a parking lot', async ({ page }) => {
    // 1. Manager Login
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(managerCredentials.email);
    await page.getByPlaceholder('Min 8 chars, upper + lower + number').fill(managerCredentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // 2. Navigate to Spot Editor
    await page.goto('/manager/spots');
    
    // 3. Select a lot from the dropdown
    const lotSelect = page.getByLabel('Select Lot');
    await expect(lotSelect).toBeVisible();
    
    // Wait for options to load and select the first available lot
    await expect(async () => {
      const count = await lotSelect.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass();
    await lotSelect.selectOption({ index: 1 });

    // 4. Open Bulk Create
    await page.getByRole('button', { name: 'Bulk Create' }).click();

    // 5. Fill Bulk Form
    const prefix = `E2E-${uniqueId.toString().slice(-3)}`;
    await page.getByLabel('Prefix').fill(prefix);
    await page.getByLabel('From #').fill('1');
    await page.getByLabel('To #').fill('5');
    await page.getByLabel('Floor').fill('1');
    await page.getByLabel('Price/Hour (₹)').fill('100');

    // 6. Submit
    await page.getByRole('button', { name: 'Create Spots' }).click();

    // 7. Verify Success
    await expect(page.getByText('5 spots created successfully!')).toBeVisible();
    
    // Check if the spots appear in the grid
    await expect(page.getByText(`${prefix}-01`)).toBeVisible();
    await expect(page.getByText(`${prefix}-05`)).toBeVisible();

    console.log(`Successfully bulk created spots with prefix: ${prefix}`);
  });
});
