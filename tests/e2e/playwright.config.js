"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const useRealAiria = process.env.E2E_USE_REAL_AIRIA === '1' || process.env.E2E_USE_REAL_AIRIA === 'true';
const serversAlreadyRunning = process.env.E2E_SERVERS_ALREADY_RUNNING === '1' || process.env.E2E_SERVERS_ALREADY_RUNNING === 'true';
exports.default = (0, test_1.defineConfig)({
    testDir: './',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { outputFolder: '../../playwright-report' }]],
    use: {
        baseURL: 'http://localhost:3050',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...test_1.devices['Desktop Chrome'], channel: 'chrome' },
        },
        {
            name: 'firefox',
            use: { ...test_1.devices['Desktop Firefox'] },
        },
    ],
    webServer: serversAlreadyRunning
        ? undefined
        : useRealAiria
            ? [
                {
                    command: 'cd ../.. && npm run dev --workspace=@tenderwin/airia-proxy',
                    url: 'http://localhost:3051',
                    reuseExistingServer: true,
                    timeout: 30000,
                },
                {
                    command: 'cd ../.. && bash scripts/start-addin-with-proxy.sh',
                    url: 'http://localhost:3050',
                    reuseExistingServer: true,
                    timeout: 120000,
                },
            ]
            : {
                command: 'cd ../.. && npm run dev --workspace=@tenderwin/word-addin',
                url: 'http://localhost:3050',
                reuseExistingServer: true,
                timeout: 120000,
            },
});
//# sourceMappingURL=playwright.config.js.map