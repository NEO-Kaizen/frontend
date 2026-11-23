import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_FRONTEND_PORT ?? 5173);
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 5_000 },
	reporter: [['list'], ['html', { open: 'never' }]],
	outputDir: 'test-results',
	use: {
		baseURL: `http://localhost:${port}`,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		...devices['Desktop Chrome']
	},
	webServer: {
		command: `npm run dev -- --host localhost --port ${port} --strictPort`,
		url: `http://localhost:${port}`,
		reuseExistingServer: false,
		timeout: 120_000,
		env: { ...process.env, PUBLIC_API_URL: apiUrl }
	}
});
