import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('Satış Modülü', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
  });

  test('müşteri listesi sayfası açılıyor', async ({ page }) => {
    await page.goto('/sales/customers');
    await expect(page.locator('h1')).toContainText('Müşteri');
  });

  test('sipariş listesi sayfası açılıyor', async ({ page }) => {
    await page.goto('/sales/orders');
    await expect(page.locator('h1')).toContainText('Sipariş');
  });

  test('fatura listesi sayfası açılıyor', async ({ page }) => {
    await page.goto('/sales/invoices');
    await expect(page.locator('h1')).toContainText('Fatura');
  });
});
