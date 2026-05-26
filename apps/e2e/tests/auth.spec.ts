import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('Kimlik Doğrulama', () => {
  test('login sayfası yükleniyor', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page).toHaveTitle(/ERP/i);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('yanlış şifre ile giriş başarısız', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, 'wrong-password-123');
    await expect(loginPage.errorMessage.or(page.locator('.text-destructive'))).toBeVisible({ timeout: 5000 });
  });

  test('doğru bilgilerle giriş başarılı', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('giriş sonrası dashboard görünüyor', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
    await expect(page.locator('h1')).toContainText('Ana Panel');
  });
});
