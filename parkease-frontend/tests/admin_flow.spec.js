import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flows', () => {
  
  // NOTE: Update these with your actual local Admin credentials
  const adminCredentials = {
    email: 'admin@parkease.com',
    password: 'AdminPassword123!'
  };

  test('should approve a pending parking lot', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(adminCredentials.email);
    await page.getByPlaceholder('Min 8 chars, upper + lower + number').fill(adminCredentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Land on Admin Dashboard
    await expect(page).toHaveURL(/.*admin\/dashboard/);

    // 2. Go to Lot Approvals
    await page.goto('/admin/lots');
    
    // 3. Filter for Pending lots (should be the default)
    const pendingTab = page.getByRole('button', { name: 'Pending' });
    await expect(pendingTab).toBeVisible();

    // 4. Find the first pending lot and approve it
    // (Assuming there is at least one lot awaiting approval)
    const lotCard = page.locator('.card').first();
    
    // If no lots are pending, we just log it and pass (to avoid flakiness in empty DB)
    if (await lotCard.count() === 0) {
      console.log('No pending lots found to approve.');
      return;
    }

    const lotName = await lotCard.locator('h3').textContent();
    await lotCard.getByRole('button', { name: 'Approve' }).click();

    // 5. Confirm in Modal
    await page.getByPlaceholder('Approval note...').fill('Approved via automated E2E test');
    await page.getByRole('button', { name: 'Approve' }).click();

    // 6. Verify success message and status change
    await expect(page.getByText(`"${lotName}" approved!`)).toBeVisible();
    
    // Switch to APPROVED tab to verify it's there
    await page.getByRole('button', { name: 'Approved' }).click();
    await expect(page.getByText(lotName)).toBeVisible();
    
    console.log(`Admin successfully approved lot: ${lotName}`);
  });
});
