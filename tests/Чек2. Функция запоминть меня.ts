import { chromium, expect, test } from '@playwright/test';
import { env } from 'node:process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('test222', async () => {
  const userDataDir = await mkdtemp(join(tmpdir(), 'playwright-remember-me-'));

  try {
    const firstContext = await chromium.launchPersistentContext(userDataDir, { headless: true });
    const firstPage = await firstContext.newPage();

    await firstPage.goto('https://forpasha.app.pryaniky.com/login');
    await firstPage.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER!);
    await firstPage.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD!);
    await firstPage.getByText('Запомнить меня', { exact: true }).click();
    await firstPage.getByRole('button', { name: 'Вход' }).click();
    await expect(firstPage).toHaveURL(/\/dash/);

    await firstContext.close();

    const secondContext = await chromium.launchPersistentContext(userDataDir, { headless: true });
    const secondPage = await secondContext.newPage();

    await secondPage.goto('https://forpasha.app.pryaniky.com/');
    await expect(secondPage).toHaveURL(/\/dash/);

    await secondContext.close();
  } finally {
    await rm(userDataDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  }
});
