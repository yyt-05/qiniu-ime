import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    permissions: ['microphone'],
    launchOptions: {
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
    }
  },
  webServer: [
    {
      command: 'powershell -NoProfile -Command "$env:PATH=\\"$env:USERPROFILE\\go\\bin;$env:PATH\\"; $env:QINIU_IME_LOCAL_ASR_TEXT=\\"我们用扣豆上传文件\\"; Set-Location ..\\..\\server; xgo run .\\cmd\\qiniu-ime\\main.xgo"',
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
      timeout: 120_000
    },
    {
      command: 'pnpm dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: process.env.PW_CHROME_CHANNEL === '1'
        ? { ...devices['Desktop Chrome'], channel: 'chrome' }
        : { ...devices['Desktop Chrome'] }
    }
  ]
});
