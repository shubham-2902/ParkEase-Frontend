import { test, expect } from '@playwright/test';

test('Full User Lifecycle: Register -> Auto Login -> Dashboard', async ({ page }) => {
  const uniqueId = Date.now();
  const testUser = {
    fullName: `Playwright Test ${uniqueId}`,
    email: `test_${uniqueId}@example.com`,
    password: 'Password123!',
    phone: '9876543210'
  };

  // 1. Go to Register Page
  await page.goto('/register');

  // 2. Select "Driver" role (Step 1)
  await page.getByRole('button', { name: 'Driver Find and book parking spots' }).click();

  // 3. Fill out the form (Step 2)
  await page.getByPlaceholder('John Doe').fill(testUser.fullName);
  await page.getByPlaceholder('you@example.com').fill(testUser.email);
  await page.getByPlaceholder('Min 8 chars, upper + lower + number').fill(testUser.password);
  await page.getByPlaceholder('9876543210').fill(testUser.phone);

  // 4. Submit
  await page.getByRole('button', { name: 'Create account' }).click();

  // 5. Wait for redirection to Dashboard
  // Since registration usually auto-logs in, we expect the dashboard URL
  await expect(page).toHaveURL(/.*driver\/dashboard/, { timeout: 10000 });

  // 6. Verify the user's name is visible on the dashboard
  // (Assuming your dashboard shows a welcome message with the name)
  await expect(page.getByText(testUser.fullName)).toBeVisible();

  console.log(`Successfully registered and logged in as: ${testUser.email}`);
});
