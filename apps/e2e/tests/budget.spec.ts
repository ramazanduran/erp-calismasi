import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('Bütçe Modülü', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
  });

  test('bütçe sayfası açılıyor', async ({ page }) => {
    await page.goto('/budget');
    await expect(page.locator('h1')).toContainText('Bütçe');
  });

  test('yeni bütçe formu açılıyor', async ({ page }) => {
    await page.goto('/budget');
    await page.click('text=Yeni Bütçe');
    await expect(page.locator('text=Bütçe Adı')).toBeVisible();
  });
});
