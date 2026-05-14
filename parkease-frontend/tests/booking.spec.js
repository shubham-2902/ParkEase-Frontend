import { test, expect } from '@playwright/test';

test.describe('End-to-End Booking Flow', () => {
  
  // We use a unique ID for the vehicle and user to avoid conflicts
  const uniqueId = Date.now();
  const testUser = {
    email: `booker_${uniqueId}@example.com`,
    password: 'Password123!',
    fullName: 'Booking Tester',
    phone: '9999999999'
  };

  test('should register, add a vehicle, and complete a booking', async ({ page }) => {
    // ── STEP 1: REGISTER ──
    await page.goto('/register');
    await page.getByRole('button', { name: 'Driver Find and book parking spots' }).click();
    await page.getByPlaceholder('John Doe').fill(testUser.fullName);
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('Min 8 chars, upper + lower + number').fill(testUser.password);
    await page.getByPlaceholder('9876543210').fill('9123456789');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/.*driver\/dashboard/, { timeout: 15000 });

    // ── STEP 2: ADD A VEHICLE ──
    // (A vehicle is required to create a booking)
    await page.goto('/driver/vehicles');
    await page.getByRole('button', { name: 'Add Vehicle' }).click();
    await page.getByPlaceholder('MH12AB1234').fill(`TEST-${uniqueId}`);
    await page.getByPlaceholder('Honda').fill('Tesla');
    await page.getByPlaceholder('City').fill('Model 3');
    await page.getByRole('button', { name: 'Register Vehicle' }).click();
    await expect(page.getByText('Vehicle registered!')).toBeVisible();

    // ── STEP 3: SEARCH FOR PARKING ──
    await page.goto('/');
    await page.getByPlaceholder('Search by city, area or landmark...').fill('Mumbai');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for results and click the first "View & Book" button
    await page.locator('.card').first().waitFor();
    await page.getByRole('button', { name: 'View & Book' }).first().click();
    
    // Wait for the Lot Detail page to load
    await page.waitForURL(/.*lots\/\d+/);

    // ── STEP 4: SELECT AN AVAILABLE SPOT ──
    // Wait for spots to load and find one that is AVAILABLE (emerald-50)
    await page.locator('.bg-emerald-50').first().waitFor();
    const availableSpot = page.locator('.bg-emerald-50').first();
    await availableSpot.click();

    // Wait for the Booking flow page/modal to load
    await page.waitForURL(/.*driver\/bookings/);
    
    // ── STEP 5: FILL BOOKING MODAL ──
    // Find the select dropdown directly inside the modal
    const vehicleDropdown = page.locator('select').first();
    
    await expect(async () => {
      const count = await vehicleDropdown.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });

    // Grab the value of the first real vehicle (index 1) and select it
    const vehicleValue = await vehicleDropdown.locator('option').nth(1).getAttribute('value');
    await vehicleDropdown.selectOption(vehicleValue);
    
    // Set End Time (Vite uses datetime-local which needs a specific format)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 5);
    const formattedDate = futureDate.toISOString().slice(0, 16);
    await page.locator('input[type="datetime-local"]').last().fill(formattedDate);

    // Confirm
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // ── STEP 6: VERIFY SUCCESS ──
    // Wait for either the success alert or the booking card to appear
    await expect(page.locator('.card').filter({ hasText: 'Booking #' }).first()).toBeVisible({ timeout: 15000 });
    
    console.log(`Booking successfully completed for ${testUser.email}`);
  });
});
