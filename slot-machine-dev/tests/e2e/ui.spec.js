const { test, expect } = require('@playwright/test');

test.describe('Social Casino UI Foundation', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming the app is served from the 'public' directory
    // In a real environment, you'd provide the local server URL
    await page.goto('http://localhost:3000');
  });

  test('should load the page with correct title and disclaimer', async ({ page }) => {
    await expect(page).toHaveTitle(/Social Casino/);
    await expect(page.locator('.disclaimer')).toContainText('NO REAL MONEY REQUIRED');
  });

  test('should display initial level and balance', async ({ page }) => {
    await expect(page.locator('#current-level')).toHaveText('1');
    await expect(page.locator('#current-balance')).toHaveText('1000');
  });

  test('should update balance after a spin', async ({ page }) => {
    const initialBalanceText = await page.locator('#current-balance').textContent();
    const initialBalance = parseInt(initialBalanceText);
    
    // Set a known bet
    await page.fill('#bet-amount', '10');
    
    // Click spin
    await page.click('#spin-button');
    
    // The balance should change (either decrease by 10 or increase/decrease depending on win)
    const newBalanceText = await page.locator('#current-balance').textContent();
    const newBalance = parseInt(newBalanceText);
    
    expect(newBalance).not.toBe(initialBalance);
  });

  test('should show error message for insufficient funds', async ({ page }) => {
    // Fill a bet higher than initial balance
    await page.fill('#bet-amount', '2000');
    await page.click('#spin-button');
    
    await expect(page.locator('#message-display')).toContainText('Insufficient balance');
    await expect(page.locator('#message-display'))
      .toHaveCSS('color', 'rgb(211, 47, 47)'); // Red color
  });
});
