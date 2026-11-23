/// <reference types="node" />

import { expect, test, type Page } from '@playwright/test';

/** RF20 #236: frontend, API real e seed fictício de desenvolvimento. */
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:5173';
const PASSWORD = process.env.E2E_PASSWORD;
const ADMIN_EMAIL = 'administrador_teste@email.com';
const HOME_URL = new URL('/home', FRONTEND_URL).toString();

async function authenticate(page: Page): Promise<void> {
	if (!PASSWORD) {
		throw new Error('Defina E2E_PASSWORD no mesmo terminal em que executa o Playwright.');
	}

	const response = await page.request.post(new URL('/auth/login', API_URL).toString(), {
		data: { email: ADMIN_EMAIL, password: PASSWORD }
	});
	if (!response.ok()) {
		throw new Error(`Login na API falhou: HTTP ${response.status()}. Confira o seed de teste.`);
	}

	// APIRequestContext da página compartilha o cookie HttpOnly com o navegador.
	// Se a API usar localhost e o frontend usar 127.0.0.1 (ou vice-versa),
	// o cookie pertence a outro host. Espelhamos SOMENTE no contexto de teste.
	const sessionCookie = (await page.context().cookies(API_URL)).find(
		(cookie) => cookie.name === 'session_id'
	);
	if (!sessionCookie) {
		throw new Error('A API aceitou o login, mas não criou o cookie session_id.');
	}

	if (new URL(API_URL).hostname !== new URL(FRONTEND_URL).hostname) {
		await page.context().addCookies([
			{
				name: sessionCookie.name,
				value: sessionCookie.value,
				url: new URL('/', FRONTEND_URL).toString(),
				httpOnly: true,
				secure: new URL(FRONTEND_URL).protocol === 'https:',
				sameSite: 'Lax'
			}
		]);
	}

	// Verifica a sessão antes de começar os testes visuais.
	const me = await page.request.get(new URL('/auth/me', API_URL).toString());
	if (!me.ok()) {
		throw new Error(`O login respondeu OK, mas /auth/me retornou HTTP ${me.status()}.`);
	}

	// O sino é renderizado somente se o SvelteKit reconhecer a sessão no SSR.
	// O pré-teste distingue erro de login/redirecionamento de erro de animação.
	const home = await page.request.get(HOME_URL, { maxRedirects: 0 });
	if (home.status() >= 300 && home.status() < 400) {
		const location = home.headers().location ?? '(sem Location)';
		throw new Error(
			`O frontend redirecionou /home (HTTP ${home.status()}) para ${location}. ` +
				'Confira PUBLIC_API_URL no .env do frontend e use o mesmo host ' +
				'(localhost ou 127.0.0.1) no frontend e na API.'
		);
	}
	if (!home.ok()) {
		throw new Error(`A Home do frontend respondeu HTTP ${home.status()}.`);
	}
}

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
	test(`RF20 #236: skeletons e toast com movimento ${reducedMotion}`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion });
		await authenticate(page);

		// Segura as requisições da lista para poder inspecionar os skeletons.
		let releaseList!: () => void;
		const gate = new Promise<void>((resolve) => {
			releaseList = resolve;
		});

		await page.route(/\/notifications(?:\?.*)?$/, async (route) => {
			if (route.request().method() === 'GET') {
				await gate;
			}
			await route.continue();
		});

		const bell = page.locator('.notification-bell');
		const center = page.locator('.notification-center');
		const badgeSkeleton = page.getByTestId('notification-badge-skeleton');
		const listSkeleton = page.getByTestId('notification-list-skeleton');

		try {
			// O HTML SSR pode mostrar o sino antes de o Svelte hidratar o clique.
			// Esperar a requisição inicial do contador garante que o estado do
			// componente foi inicializado no navegador antes de interagir.
			const initialCountRequest = page.waitForRequest(
				(request) =>
					request.method() === 'GET' &&
					new URL(request.url()).pathname === '/notifications/unread-count',
				{ timeout: 15_000 }
			);
			const navigation = await page.goto(HOME_URL, { waitUntil: 'load' });
			await initialCountRequest;
			if (!navigation || !navigation.ok()) {
				throw new Error(`Falha ao abrir /home: HTTP ${navigation?.status() ?? 'sem resposta'}.`);
			}
			if (new URL(page.url()).pathname !== '/home') {
				throw new Error(
					`Esperava /home após autenticar, mas o navegador está em ${page.url()}. ` +
						'O frontend provavelmente não reconheceu a sessão.'
				);
			}

			try {
				await expect(bell).toBeVisible({ timeout: 5000 });
			} catch {
				const heading = (await page.locator('h1').allTextContents()).join(' | ');
				throw new Error(
					`O sino não foi renderizado em ${page.url()}. ` +
						`Títulos encontrados: ${heading || '(nenhum)'}. ` +
						'Confira se a Home usa a sessão correta e se NotificationBell está no Header.'
				);
			}

			await expect(badgeSkeleton).toBeVisible();
			await expect(bell).toHaveAttribute('aria-busy', 'true');

			await bell.click();
			await expect(bell).toHaveAttribute('aria-expanded', 'true');
			await expect(center).toBeVisible();
			await expect(listSkeleton).toBeVisible();
			await expect(center.getByRole('status')).toContainText(/Carregando notifica/i);

			const badgeAnimation = await badgeSkeleton.evaluate(
				(element) => getComputedStyle(element).animationName
			);
			const listAnimation = await listSkeleton
				.locator('.skeleton-line')
				.first()
				.evaluate((element) => getComputedStyle(element).animationName);

			expect(badgeAnimation === 'none').toBe(reducedMotion === 'reduce');
			expect(listAnimation === 'none').toBe(reducedMotion === 'reduce');
		} finally {
			// Libera a API mesmo quando uma asserção falhar.
			releaseList();
		}

		await expect(listSkeleton).toBeHidden();
		await expect(badgeSkeleton).toBeHidden();
		await expect(bell).toHaveAttribute('aria-busy', 'false');

		const row = center.locator('.center-list > li:not(.skeleton-card)').first();
		if ((await row.count()) > 0) {
			const rowAnimation = await row.evaluate((element) => getComputedStyle(element).animationName);
			expect(rowAnimation === 'none').toBe(reducedMotion === 'reduce');
		}

		// Usa o estado global real do Vite para gerar um toast sem mudar a produção.
		await page.evaluate(async () => {
			// @ts-expect-error Caminho de módulo resolvido pelo Vite no navegador.
			const module = await import('/src/lib/states/toast.svelte.ts');
			module.toastState.add('Validacao RF20 de movimento', 'info');
		});

		const toast = page.locator('.toast-item').filter({ hasText: 'Validacao RF20 de movimento' });
		await expect(toast).toBeVisible();
		const toastAnimation = await toast.evaluate(
			(element) => getComputedStyle(element).animationName
		);
		expect(toastAnimation === 'none').toBe(reducedMotion === 'reduce');

		// Verifica que o Centro não ultrapassa a largura de um celular.
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(center).toBeVisible();
		const bounds = await center.boundingBox();
		expect(bounds).not.toBeNull();
		if (bounds) {
			expect(bounds.x).toBeGreaterThanOrEqual(0);
			expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
		}

		await page.screenshot({
			path: `test-results/rf20-236-${reducedMotion}.png`,
			fullPage: false
		});
	});
}
