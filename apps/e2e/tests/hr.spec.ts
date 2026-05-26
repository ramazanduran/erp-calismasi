import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('İnsan Kaynakları Modülü', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
  });

  test('personel listesi sayfası açılıyor', async ({ page }) => {
    await page.goto('/hr/employees');
    await expect(page.locator('h1')).toContainText('Personel');
  });

  test('izin yönetimi sayfası açılıyor', async ({ page }) => {
    await page.goto('/hr/leaves');
    await expect(page.locator('h1')).toContainText('İzin');
  });

  test('bordro sayfası açılıyor', async ({ page }) => {
    await page.goto('/hr/payroll');
    await expect(page.locator('h1')).toContainText('Bordro');
  });

  test('performans değerlendirme sayfası açılıyor', async ({ page }) => {
    await page.goto('/hr/performance');
    await expect(page.locator('h1')).toContainText('Performans');
  });
});
