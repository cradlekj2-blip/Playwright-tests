import { chromium, expect, test } from '@playwright/test';
import { env } from 'node:process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const loginUrl = 'https://forpasha.app.pryaniky.com/login';
const dashboardUrl = 'https://forpasha.app.pryaniky.com/dash';

test('Сохраняет авторизацию при включенном флажке «Запомнить меня»', async () => {
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
