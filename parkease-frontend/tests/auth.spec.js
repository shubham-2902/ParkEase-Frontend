import { test, expect } from '@playwright/test';

test.describe('Authentication and Protected Routes', () => {

  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    // Attempt to access driver dashboard directly
    await page.goto('/driver/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
    
    // Check for "Welcome back" heading
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');

    // Click sign in without entering details
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Check for validation messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Click "Create one free"
    await page.getByRole('link', { name: 'Create one free' }).click();

    // Should be on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByText('Create your account')).toBeVisible();
  });

});
