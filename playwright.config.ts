import { defineConfig } from '@playwright/test';

const previewURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: previewURL || 'http://127.0.0.1:5173',
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: previewURL ? undefined : {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
