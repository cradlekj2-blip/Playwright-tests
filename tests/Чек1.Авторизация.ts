import { chromium, test, expect } from '@playwright/test';
import { env } from 'node:process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.goto('https://forpasha.app.pryaniky.com/login');
});

test('Вход с валидным логином и валидным паролем', async ({ page }) => {
  // Проверяем, что отображается заголовок страницы авторизации.
  await expect(page.getByText('Добро пожаловать', { exact: true })).toBeVisible();

  // Заполняем поле логина или электронной почты.
  await page.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER!);

  // Заполняем поле пароля.
  await page.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD!);

  // Нажимаем "Вход".
  await page.getByRole('button', { name: 'Вход' }).click();

  // Проверяем переход на страницу dashboard.
  await expect(page).toHaveURL(/\/dash/);
});
