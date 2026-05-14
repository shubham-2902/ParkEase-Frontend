import { test, expect } from '@playwright/test';

test.describe('Manager Portal Flows', () => {
  const uniqueId = Date.now();
  const managerUser = {
    fullName: `Manager ${uniqueId}`,
    email: `manager_${uniqueId}@example.com`,
    password: 'Password123!',
    phone: '8888888888'
  };

  test('should register as manager and list a new parking lot', async ({ page }) => {
    // 1. Register as Manager
    await page.goto('/register');
    
    // Select "Manager" role card
    await page.getByRole('button', { name: 'Manager List and manage your parking assets' }).click();
    
    // Fill Registration
    await page.getByPlaceholder('John Doe').fill(managerUser.fullName);
    await page.getByPlaceholder('you@example.com').fill(managerUser.email);
    await page.getByPlaceholder('Min 8 chars, upper + lower + number').fill(managerUser.password);
    await page.getByPlaceholder('9876543210').fill(managerUser.phone);
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should land on Manager Dashboard
    await expect(page).toHaveURL(/.*manager\/dashboard/);

    // 2. Go to Lot Management
    await page.goto('/manager/lots');
    await page.getByRole('button', { name: 'Add Lot' }).click();

    // 3. Fill Lot Details
    await page.getByLabel('Lot Name').fill(`E2E Test Lot ${uniqueId}`);
    await page.getByLabel('Description').fill('Automated test lot for manager flow verification');
    await page.getByLabel('Street Address').fill('456 Testing Street');
    await page.getByLabel('City').fill('Mumbai');
    await page.getByLabel('State').fill('Maharashtra');
    await page.getByLabel('PIN Code').fill('400001');
    
    // GPS Coordinates
    await page.getByLabel('Latitude').fill('19.0760');
    await page.getByLabel('Longitude').fill('72.8777');
    
    // Pricing & Capacity
    await page.getByLabel('Total Spots').fill('50');
    await page.getByLabel('Price per Hour (₹)').fill('120');

    // 4. Submit
    await page.getByRole('button', { name: 'Register Lot' }).click();

    // 5. Verify Success
    await expect(page.getByText('Lot registered! Awaiting admin approval.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`E2E Test Lot ${uniqueId}`)).toBeVisible();
    
    console.log(`Manager Lot registered: E2E Test Lot ${uniqueId}`);
  });
});
