import { chromium, expect, test } from '@playwright/test';
import { env } from 'node:process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

//Проверка для всех тестов
test.beforeEach(async ({ page }) => {
  // Открываем страницу авторизации.
  await page.goto('https://forpasha.app.pryaniky.com/login');
  // Заполняем поле логина.
  await page.getByRole('textbox', { name: 'Логин или e-mail' }).fill(env.APP_USER!);
  // Заполняем поле пароля.
  await page.getByRole('textbox', { name: 'Пароль' }).fill(env.APP_PASSWORD!);
  // Нажимаем "Вход".
  await page.getByRole('button', { name: 'Вход' }).click();
  // Проверяем переход на страницу dashboard.
  await expect(page).toHaveURL('https://forpasha.app.pryaniky.com/');
});

test('Создание и удаления тестовой публикации в отдельной группе тест111', async ({ page }) => {
  // Переходим на страницу группы.
  await page.goto('https://forpasha.app.pryaniky.com/group/9959');
  // Проверяем, что открылась нужная группа.
  await expect(page).toHaveURL('https://forpasha.app.pryaniky.com/group/9959');
  // Активируем первый редактор публикации.
  await page.locator('.DraftEditorMui5').first().click();
  // Ждём одну секунду, чтобы редактор успел активироваться.
  await page.waitForTimeout(1000);
  // Вводим текст публикации.
  const publicationEditor = page
    .locator('.DraftEditorMui5')
    .first()
    .locator('[contenteditable="true"]');
  await publicationEditor.pressSequentially('Test1');
  // Ждём одну секунду, чтобы редактор успел активироваться.
  await page.waitForTimeout(2000);
  // Проверяем, что текст действительно появился в редакторе.
  await expect(publicationEditor).toContainText('Test1');
  // Нажимаем кнопку "Опубликовать".
  await page.getByRole('button', { name: 'Опубликовать' }).click();
  await page.waitForTimeout(3000);
  // Обновляем страницу группы после публикации.
  await page.reload();
  // Проверяем, что публикация появилась в ленте.
  await expect(page.getByText('Test1', { exact: true })).toBeVisible();
  // Открываем меню действий публикации.
  await page
    .locator('.NewsFullView')
    .filter({ hasText: 'Test1' })
    .locator(
      '.MuiButtonBase-root.MuiButton-root.MuiButton-text.MuiButton-textPrimary.MuiButton-sizeSmall',
    )
    .first()
    .click();
  // Выбираем действие удаления публикации.
  await page.getByRole('menuitem', { name: 'Удалить' }).click();
  // Подтверждаем удаление публикации.
  await page.getByRole('button', { name: 'Подтвердить' }).click();
  // Проверяем, что текст удалён и больше не отображается.
  await expect(page.getByText('Test1', { exact: true })).not.toBeVisible();
});
