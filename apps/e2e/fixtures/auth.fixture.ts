import { test as base, expect } from '@playwright/test';

export interface AuthState {
  email: string;
  password: string;
  orgSlug: string;
}

export const TEST_USER: AuthState = {
  email: process.env.TEST_EMAIL ?? 'admin@testorg.com',
  password: process.env.TEST_PASSWORD ?? 'Test1234!',
  orgSlug: process.env.TEST_ORG ?? 'testorg',
};

export const test = base.extend<{
  authenticatedPage: ReturnType<typeof base>['context'] extends Promise<infer C> ? C : never;
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await use(page as unknown as ReturnType<typeof base>['context'] extends Promise<infer C> ? C : never);
  },
});

export { expect };
