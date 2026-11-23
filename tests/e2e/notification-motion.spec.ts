/// <reference types="node" />

import { expect, test } from '@playwright/test';
import { TOAST_DISPLAY_DURATION_MS } from '../../src/lib/constants/toast';
import {
	USERS,
	bell,
	listNotifications,
	loginApi,
	loginOnPage,
	notificationCenter
} from './support/rf20';

const HOME_PATH = USERS.admin.path;

/**
 * RF20 #236: estados de carregamento e movimento do sino, Centro e Toast.
 * Usa a API real e a massa fictícia do seed; a suíte exige banco recém-semeado.
 */
test.describe.serial('RF20 #236 — skeletons e movimento reduzido', () => {
	test.beforeAll(async () => {
		const admin = await loginApi(USERS.admin.email);

		try {
			const notifications = await listNotifications(admin);

			expect(
				notifications.length,
				'A massa E2E não tem notificações para o administrador. Restaure com "npm run seed:run" no backend.'
			).toBeGreaterThan(0);
		} finally {
			await admin.dispose();
		}
	});

	for (const reducedMotion of ['reduce', 'no-preference'] as const) {
		test(`skeletons, lista e toast com movimento ${reducedMotion}`, async ({ page }) => {
			await page.emulateMedia({ reducedMotion });

			// Segura as duas requisições iniciais: o badge e a lista precisam
			// ficar em carregamento ao mesmo tempo para os skeletons serem vistos.
			let release!: () => void;
			const gate = new Promise<void>((resolve) => {
				release = resolve;
			});

			await page.route(/\/notifications(?:\/unread-count)?(?:\?.*)?$/, async (route) => {
				if (route.request().method() === 'GET') {
					await gate;
				}

				await route.continue();
			});

			try {
				await loginOnPage(page, 'admin');

				// O HTML SSR já mostra o sino, mas o handler só existe depois da
				// hidratação. A requisição inicial do contador prova que o efeito
				// do componente rodou no navegador antes do clique.
				const initialCountRequest = page.waitForRequest(
					(request) =>
						request.method() === 'GET' &&
						new URL(request.url()).pathname === '/notifications/unread-count',
					{ timeout: 15_000 }
				);

				const navigation = await page.goto(HOME_PATH, { waitUntil: 'load' });

				await initialCountRequest;

				if (!navigation || !navigation.ok()) {
					throw new Error(
						`Falha ao abrir ${HOME_PATH}: HTTP ${navigation?.status() ?? 'sem resposta'}.`
					);
				}

				const bellElement = bell(page);
				const badgeSkeleton = page.getByTestId('notification-badge-skeleton');

				await expect(bellElement).toBeVisible({ timeout: 5_000 });
				await expect(bellElement).toHaveAttribute('aria-busy', 'true');
				await expect(badgeSkeleton).toBeVisible();

				await bellElement.click();

				const center = notificationCenter(page);
				const listSkeleton = page.getByTestId('notification-list-skeleton');

				await expect(center).toBeVisible();
				await expect(center.getByRole('status')).toContainText(/Carregando notifica/i);
				await expect(listSkeleton).toBeVisible();

				const badgeAnimation = await badgeSkeleton.evaluate(
					(element) => getComputedStyle(element).animationName
				);
				const listAnimation = await listSkeleton
					.locator('.skeleton-line')
					.first()
					.evaluate((element) => getComputedStyle(element).animationName);

				expect(badgeAnimation === 'none').toBe(reducedMotion === 'reduce');
				expect(listAnimation === 'none').toBe(reducedMotion === 'reduce');

				await expect(bellElement).toHaveScreenshot(
					`notification-bell-skeleton-${reducedMotion}.png`,
					{ animations: 'disabled' }
				);
				await expect(center).toHaveScreenshot(`notification-center-skeleton-${reducedMotion}.png`, {
					animations: 'disabled'
				});
			} finally {
				release();
			}

			const center = notificationCenter(page);
			const listSkeleton = page.getByTestId('notification-list-skeleton');
			const badgeSkeleton = page.getByTestId('notification-badge-skeleton');
			const firstCard = center.locator('.notification-card').first();

			await expect(listSkeleton).toBeHidden();
			await expect(badgeSkeleton).toBeHidden();
			await expect(bell(page)).toHaveAttribute('aria-busy', 'false');
			await expect(firstCard).toBeVisible();

			const cardTransition = await firstCard.evaluate(
				(element) => getComputedStyle(element).transitionProperty
			);

			if (reducedMotion === 'reduce') {
				expect(cardTransition).toBe('none');
			} else {
				expect(cardTransition).toContain('background-color');
			}

			// Dispara o Toast pelo fluxo real: o PATCH de leitura falha e o
			// Centro usa `notifyError`, sem importar o state por dentro do Vite.
			const markRead = page.waitForRequest(
				(request) => request.method() === 'PATCH' && request.url().endsWith('/read')
			);

			await page.route('**/notifications/*/read', (route) => route.abort());
			await page.clock.install();
			await firstCard.click();
			await markRead;

			const toast = page.locator('.toast-item');

			await expect(toast).toBeVisible();
			await expect(toast).toContainText('Não foi possível marcar a notificação como lida.');

			const toastAnimation = await toast.evaluate(
				(element) => getComputedStyle(element).animationName
			);

			expect(toastAnimation === 'none').toBe(reducedMotion === 'reduce');

			await expect(toast).toHaveScreenshot(`toast-${reducedMotion}.png`, {
				animations: 'disabled'
			});

			// O Timer usa a constante compartilhada; o relógio falso evita 4s reais.
			await page.clock.fastForward(TOAST_DISPLAY_DURATION_MS);
			await expect(toast).toBeHidden();

			// O Centro não pode vazar nem criar rolagem horizontal em um celular.
			// A Home já tem uma tabela larga nesse viewport; por isso a checagem
			// olha o próprio Centro, não o documento inteiro.
			await page.setViewportSize({ width: 390, height: 844 });
			await expect(center).toBeVisible();

			const bounds = await center.boundingBox();
			const viewport = page.viewportSize();

			expect(bounds).not.toBeNull();
			expect(viewport).not.toBeNull();

			if (bounds && viewport) {
				expect(bounds.x).toBeGreaterThanOrEqual(0);
				expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
			}

			const bodyOverflow = await center
				.locator('.center-body')
				.evaluate((element) => element.scrollWidth > element.clientWidth);

			expect(bodyOverflow).toBe(false);
		});
	}
});
