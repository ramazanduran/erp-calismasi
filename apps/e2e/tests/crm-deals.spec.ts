import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('CRM Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
  });

  test('pipeline sayfası açılıyor', async ({ page }) => {
    await page.goto('/crm/deals');
    await expect(page.locator('h1')).toContainText('Pipeline');
  });

  test('kanban görünümü çalışıyor', async ({ page }) => {
    await page.goto('/crm/deals');
    await expect(page.locator('text=Nitelendirme')).toBeVisible();
    await expect(page.locator('text=Teklif')).toBeVisible();
    await expect(page.locator('text=Müzakere')).toBeVisible();
  });

  test('liste görünümüne geçiş çalışıyor', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.click('text=Liste');
    await expect(page.locator('text=Fırsat')).toBeVisible();
  });

  test('yeni fırsat formu açılıyor', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.click('text=Yeni Fırsat');
    await expect(page.locator('text=Fırsat Adı')).toBeVisible();
  });

  test('istatistik kartları görünüyor', async ({ page }) => {
    await page.goto('/crm/deals');
    await expect(page.locator('text=Açık Fırsatlar')).toBeVisible();
    await expect(page.locator('text=Kazanma Oranı')).toBeVisible();
  });
});
