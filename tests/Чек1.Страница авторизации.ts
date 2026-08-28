import { chromium, test, expect } from '@playwright/test';
import { env } from 'node:process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
//Делаем константами ссылки на страницы, чтобы не дублировать их в коде тестов.
const loginUrl = 'https://forpasha.app.pryaniky.com/login';
const dashboardUrl = 'https://forpasha.app.pryaniky.com/dash';

//Ставим последовательный запуск тестов в текущем файле.
test.describe.configure({ mode: 'serial' });

//Указываем, что перед каждым тестом нужно открывать страницу логина и проверять, что на ней отображается приветствие.
test.beforeEach(async ({ page }) => {
  await page.goto('https://forpasha.app.pryaniky.com/login');
  await expect(page.getByText('Добро пожаловать', { exact: true })).toBeVisible();
});

test.describe('Проверка наличия элементов на странице', () => {
  //Проверяем наличие кнопки "Восстановить пароль".
  test('Наличие кнопки Восстановить пароль', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Восстановить пароль' })).toBeVisible();
  });
  //Проверяем наличие кнопки смены языка.
  test('Наличие кнопки смены языка', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Русский' })).toBeVisible();
  });
});
//Проверяем смену языка на английский и обратно на русский.
test.describe('Проверка смены языка', () => {
  test('С русского языка на английский', async ({ page }) => {
    // Открываем список доступных языков.
    await expect(page.getByRole('button', { name: 'Русский' })).toBeVisible();
    await page.getByRole('button', { name: 'Русский' }).click();

    // Проверяем, что в списке отображается вариант English.
    await expect(page.getByText('English', { exact: true })).toBeVisible();

    // Выбираем английский язык.
    await page.getByText('English', { exact: true }).click();

    // Проверяем, что приветствие изменилось на английское.
    await expect(page.getByText('welcome', { exact: false })).toBeVisible();
  });

  test('Смена языка на русский', async ({ page }) => {
    // Открываем список доступных языков.
    await expect(page.getByRole('button', { name: 'Русский' })).toBeVisible();
    await page.getByRole('button', { name: 'Русский' }).click();

    // Проверяем, что в списке отображается вариант English.
    await expect(page.getByText('English', { exact: true })).toBeVisible();

    // Выбираем английский язык.
    await page.getByText('English', { exact: true }).click();

    // Проверяем, что приветствие изменилось на английское.
    await expect(page.getByText('welcome', { exact: false })).toBeVisible();

    // Повторно открываем список доступных языков.
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
    await page.getByRole('button', { name: 'English' }).click();

    // Проверяем, что в списке отображается вариант Русский.
    await expect(page.getByText('Русский', { exact: true })).toBeVisible();

    // Выбираем русский язык.
    await page.getByText('Русский', { exact: true }).click();

    // Проверяем, что приветствие изменилось на русское.
    await expect(page.getByText('Добро пожаловать', { exact: false })).toBeVisible();
  });
});

test.describe('Тесты логина на портал', () => {
  //Проверки входа
  test('Вход с валидным логином и валидным паролем', async ({ page }) => {
    // Заполняем поле логина или электронной почты.
    await page.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER!);

    // Заполняем поле пароля.
    await page.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD!);

    // Нажимаем "Вход".
    await page.getByRole('button', { name: 'Вход' }).click();

    // Проверяем переход на страницу dashboard.
    await expect(page).toHaveURL('https://forpasha.app.pryaniky.com/');

    await page.context().close();
  });

  test('Вход с НЕвалидным логином и валидным паролем', async ({ page }) => {
    // Проверяем наличие пароля в переменных окружения.
    if (!env.APP_PASSWORD) {
      throw new Error('Для теста задайте APP_PASSWORD в .env');
    }

    // Генерируем случайный невалидный логин из пяти английских букв.
    const invalidLogin = Array.from({ length: 5 }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    ).join('');

    // Заполняем поле логина случайным значением.
    await page.getByRole('textbox', { name: 'Логин или e-mail' }).fill(invalidLogin);
    // Заполняем поле пароля.
    await page.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD);
    // Нажимаем "Вход".
    await page.getByRole('button', { name: 'Вход' }).click();

    // Проверяем сообщение об ошибке авторизации.
    await expect(
      page.getByText('Пожалуйста, проверьте введенные данные, что-то из них не верно', {
        exact: true,
      }),
    ).toBeVisible();
    // Проверяем, что остаёмся на странице авторизации.
    await expect(page).toHaveURL(/\/login/);

    // Закрываем браузерный контекст.
    await page.context().close();
  });

  test('Вход с НЕвалидным паролем и валидным логином', async ({ page }) => {
    // Генерируем случайный невалидный пароль из пяти английских букв.
    const invalidPassword = Array.from({ length: 5 }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    ).join('');

    // Заполняем поле логина.
    await page.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER!);
    // Заполняем поле пароля случайным значением.
    await page.getByRole('textbox', { name: 'Пароль' }).fill(invalidPassword);
    // Нажимаем "Вход".
    await page.getByRole('button', { name: 'Вход' }).click();

    // Проверяем сообщение об ошибке авторизации.
    await expect(
      page.getByText('Пожалуйста, проверьте введенные данные, что-то из них не верно', {
        exact: true,
      }),
    ).toBeVisible();
    // Проверяем, что остаёмся на странице авторизации.
    await expect(page).toHaveURL(/\/login/);

    // Закрываем браузерный контекст.
    await page.context().close();
  });

  test('Вход с пустым логином', async ({ page }) => {
    // Проверяем наличие пароля в переменных окружения.
    if (!env.APP_PASSWORD) {
      throw new Error('Для теста задайте APP_PASSWORD в .env');
    }

    // Заполняем поле пароля, оставляя поле логина пустым.
    await page.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD);
    // Нажимаем "Вход".
    await page.getByRole('button', { name: 'Вход' }).click();

    // Проверяем сообщение о незаполненных полях.
    await expect(page.getByText('Пожалуйста, заполните все поля', { exact: true })).toBeVisible();

    // Закрываем браузерный контекст.
    await page.context().close();
  });

  test('Вход с пустым паролем', async ({ page }) => {
    // Проверяем наличие логина в переменных окружения.
    if (!env.APP_USER) {
      throw new Error('Для теста задайте APP_USER в .env');
    }

    // Заполняем поле логина, оставляя поле пароля пустым.
    await page.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER);
    // Нажимаем "Вход".
    await page.getByRole('button', { name: 'Вход' }).click();

    // Проверяем сообщение о незаполненных полях.
    await expect(page.getByText('Пожалуйста, заполните все поля', { exact: true })).toBeVisible();

    // Закрываем браузерный контекст.
    await page.context().close();
  });
});

test.describe('Проверка флага "Запомнить меня"', () => {
  test('Сохранения сесии при включенном флажке «Запомнить меня»', async () => {
    if (!env.APP_USER || !env.APP_PASSWORD) {
      throw new Error('Для теста задайте APP_USER и APP_PASSWORD в .env');
    }

    const userDataDir = await mkdtemp(join(tmpdir(), 'playwright-remember-me-'));

    try {
      const firstContext = await chromium.launchPersistentContext(userDataDir);
      try {
        const firstPage = await firstContext.newPage();

        await firstPage.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await expect(firstPage.getByRole('textbox', { name: 'Логин или e-mail' })).toBeVisible();
        await firstPage.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER);
        await firstPage.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD);

        await firstPage.getByText('Запомнить меня', { exact: true }).click();
        await expect(firstPage.getByRole('checkbox', { name: 'Запомнить меня' })).toBeChecked();

        await Promise.all([
          expect(firstPage).toHaveURL(/\/dash/, { timeout: 15000 }),
          firstPage.getByRole('button', { name: 'Вход' }).click({ noWaitAfter: true }),
        ]);
      } finally {
        await firstContext.close();
      }

      const secondContext = await chromium.launchPersistentContext(userDataDir);
      try {
        const secondPage = await secondContext.newPage();

        await secondPage.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await expect(secondPage).toHaveURL('https://forpasha.app.pryaniky.com/dash');
      } finally {
        await secondContext.close();
      }
    } finally {
      await rm(userDataDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
    }
  });
});
