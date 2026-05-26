import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
  });

  test('KPI kartları görünüyor', async ({ page }) => {
    await expect(page.locator('text=Aylık Gelir')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Aktif Siparişler')).toBeVisible();
    await expect(page.locator('text=Stok Kalemi')).toBeVisible();
    await expect(page.locator('text=Aktif Müşteri')).toBeVisible();
  });

  test('sidebar navigasyon çalışıyor', async ({ page }) => {
    await page.click('text=Satış & CRM');
    await expect(page.locator('text=Müşteriler')).toBeVisible();
  });

  test('hızlı işlemler bölümü var', async ({ page }) => {
    await expect(page.locator('text=Hızlı İşlemler')).toBeVisible();
    await expect(page.locator('text=Sipariş Oluştur')).toBeVisible();
  });
});
