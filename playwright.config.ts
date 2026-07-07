import { defineConfig, devices } from '@playwright/test';

const isProd = process.env.TEST_ENV === 'production';
const baseURL = process.env.BASE_URL || (isProd ? 'https://tramthucungvp.github.io' : 'http://localhost:8000');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
  webServer: isProd
    ? undefined
    : {
        command: 'python -m http.server 8000',
        url: 'http://localhost:8000',
        reuseExistingServer: !process.env.CI,
      },
});
