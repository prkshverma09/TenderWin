import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
  ],
  webServer: {
    command: 'cd ../.. && npm run dev --workspace=@tenderwin/word-addin',
    url: 'http://localhost:3050',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
