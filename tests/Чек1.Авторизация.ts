import { test, expect } from '@playwright/test';
import { env } from 'node:process';

test('Авторизация на сайте', async ({ page }) => {
  // Открываем страницу авторизации.
  await page.goto('https://forpasha.app.pryaniky.com/login');

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
