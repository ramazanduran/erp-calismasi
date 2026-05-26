import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/auth.fixture';

test.describe('Stok Modülü', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL('/');
  });

  test('ürün listesi sayfası açılıyor', async ({ page }) => {
    await page.goto('/inventory/products');
    await expect(page.locator('h1')).toContainText('Ürün');
  });

  test('stok hareketleri sayfası açılıyor', async ({ page }) => {
    await page.goto('/inventory/movements');
    await expect(page.locator('h1')).toContainText('Stok Hareketi');
  });

  test('stok sayım sayfası açılıyor', async ({ page }) => {
    await page.goto('/inventory/stock-counts');
    await expect(page.locator('h1')).toContainText('Stok Sayım');
  });

  test('fiyat listesi sayfası açılıyor', async ({ page }) => {
    await page.goto('/inventory/price-lists');
    await expect(page.locator('h1')).toContainText('Fiyat');
  });
});
