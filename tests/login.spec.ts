import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'playwright_test@aigleam.com';
const TEST_PASSWORD = 'Test123456';
const LOGIN_URL = '/login';
const HOME_URL = '/hello';

test.describe('登录功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
  });

  test('正常登录 - 正确账号密码应跳转到主页', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(`**${HOME_URL}`, { timeout: 10000 });
    expect(page.url()).toContain(HOME_URL);
  });

  test('错误密码 - 应显示错误提示', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const alert = page.locator('.MuiAlert-root');
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  test('空邮箱 - 应显示请输入邮箱提示', async ({ page }) => {
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    const alert = page.locator('.MuiAlert-root');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText('邮箱');
  });

  test('空密码 - 应显示请输入密码提示', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    const alert = page.locator('.MuiAlert-root');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).toContainText('密码');
  });

  test('邮箱格式错误 - 应显示格式不正确提示', async ({ page }) => {
    // 通过 JS 绕过浏览器 input[type=email] 的原生校验，触发 React 层的邮箱格式检查
    await page.locator('input[type="email"]').evaluate((el: HTMLInputElement, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, 'notanemail');
    await page.fill('input[type="password"]', TEST_PASSWORD);

    await page.locator('form').evaluate((f: HTMLFormElement) => f.setAttribute('novalidate', ''));
    await page.click('button[type="submit"]');

    const alert = page.locator('.MuiAlert-root');
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  test('密码可见性切换', async ({ page }) => {
    await page.fill('input[type="password"]', TEST_PASSWORD);

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    await page.click('button[aria-label="toggle password visibility"]');

    const textInput = page.locator('input[type="text"]');
    await expect(textInput).toBeVisible();
    await expect(textInput).toHaveValue(TEST_PASSWORD);
  });

  test('已登录用户访问登录页 - 应自动跳转到主页', async ({ page, context }) => {
    // 先正常登录获取 cookie
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`**${HOME_URL}`, { timeout: 10000 });

    // 再次访问登录页应自动跳回主页
    await page.goto(LOGIN_URL);
    await page.waitForURL(`**${HOME_URL}`, { timeout: 10000 });
    expect(page.url()).toContain(HOME_URL);
  });
});
