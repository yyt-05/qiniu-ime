import { test, expect } from '@playwright/test';

test('web workspace shows qiniu-ime UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('qiniu-ime', { exact: true })).toBeVisible();
  await expect(page.getByTestId('transcript-box')).toContainText('点击麦克风');
});

test('mock ASR chain returns corrected text through XGo backend', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /开始/ }).click();
  await expect(page.getByTestId('transcript-box')).toContainText('我们用扣豆');
  await page.getByRole('button', { name: /停止/ }).click();
  await expect(page.getByTestId('transcript-box')).toContainText('Kodo');
  await expect(page.getByText(/扣豆 -> Kodo/)).toBeVisible();
});

test('microphone mode sends browser audio chunks through WebSocket', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /麦克风/ }).click();
  await page.getByRole('button', { name: /开始/ }).click();
  await expect(page.getByTestId('transcript-box')).toContainText('我们用扣豆');
  await page.getByRole('button', { name: /停止/ }).click();
  await expect(page.getByTestId('transcript-box')).toContainText('Kodo');
});

test('local provider chain uses XGo provider boundary', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('provider').selectOption('local');
  await page.getByRole('button', { name: /开始/ }).click();
  await expect(page.getByTestId('transcript-box')).toContainText('正在本地识别');
  await page.getByRole('button', { name: /停止/ }).click();
  await expect(page.getByTestId('transcript-box')).toContainText('Kodo');
});

test('provider failure is visible and does not fallback silently', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('provider').selectOption('xfyun');
  await page.getByRole('button', { name: /开始/ }).click();
  await expect(page.getByText(/provider xfyun is not configured/)).toBeVisible();
});
