import { expect, test, type Page } from '@playwright/test';
import {
	DUPLICATE_CHECK_PATH,
	DUPLICATE_CHECK_ROUTE,
	DUPLICATE_RESPONSES,
	mockDuplicateRoutes
} from './support/duplicates';

const SOLICITATION_PATH = '/solicitacao';

async function fillIdentification(page: Page): Promise<void> {
	await page.getByLabel('Nome completo').fill('Ana Souza');
	await page.getByLabel('E-mail corporativo').fill('ana.souza@example.com');
	await page.getByLabel('Área do solicitante').fill('Financeiro');
	await page.getByLabel('Gestor responsável').fill('Carlos Lima');
}

async function fillDemand(page: Page): Promise<void> {
	await page.getByLabel('Título resumido da solicitação').fill('Automatizar conciliação bancária');
	await page.getByLabel('Nome do processo atual').fill('Conciliação bancária mensal');
	await page.getByLabel('Tipo de solicitação').selectOption('Automação');
	await page.getByLabel('Categoria', { exact: true }).selectOption('Automação');
	await page
		.getByLabel('Descrição da necessidade')
		.fill('Conferência manual de extratos e lançamentos.');
	await page
		.getByLabel('Problema ou oportunidade identificada')
		.fill('Retrabalho e risco de divergência no fechamento.');
	await page
		.getByLabel('Justificativa da solicitação')
		.fill('Reduzir esforço manual do time financeiro.');
	await page
		.getByLabel('Resultado esperado')
		.fill('Conciliação automática com trilha de conferência.');
}

async function openDemandStep(page: Page): Promise<void> {
	await page.goto(SOLICITATION_PATH);
	// O primeiro teste compila a rota em modo dev; aguardar a hidratação evita
	// que o clique em "Avançar" caia antes dos handlers do Svelte.
	await page.waitForLoadState('networkidle');
	await fillIdentification(page);
	await page.getByRole('button', { name: 'Avançar' }).click();
	await expect(page.getByRole('heading', { name: 'Identificação da Demanda' })).toBeVisible();
	await fillDemand(page);
}

function nextButton(page: Page) {
	return page.getByRole('button', { name: 'Avançar' });
}

function checkRequests(page: Page): string[] {
	const urls: string[] = [];
	page.on('request', (request) => {
		if (request.method() === 'POST' && request.url().endsWith(DUPLICATE_CHECK_PATH)) {
			urls.push(request.url());
		}
	});
	return urls;
}

function activeElementBelongsToDialog(page: Page): Promise<boolean> {
	return page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null);
}

test.describe('RF16 — Alerta de duplicidade na aba de Demanda', () => {
	test('alta abre modal bloqueante, com até 3 itens, revisão e criação mesmo assim', async ({
		page
	}) => {
		const requests = checkRequests(page);
		await mockDuplicateRoutes(page, { check: 'high' });
		await openDemandStep(page);

		await nextButton(page).click();

		const dialog = page.getByRole('dialog', { name: 'Possível duplicidade' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('heading', { name: 'Possível duplicidade' })).toBeVisible();
		await expect(dialog.locator('ul > li')).toHaveCount(3);
		await expect(dialog.getByRole('button', { name: 'Revisar minha solicitação' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Criar mesmo assim' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Identificação da Demanda' })).toBeVisible();
		expect(requests).toHaveLength(1);
		expect(await activeElementBelongsToDialog(page)).toBe(true);

		for (let index = 0; index < 6; index += 1) {
			await page.keyboard.press('Tab');
			expect(await activeElementBelongsToDialog(page)).toBe(true);
		}

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(nextButton(page)).toBeFocused();
		await expect(page.getByRole('heading', { name: 'Identificação da Demanda' })).toBeVisible();

		await nextButton(page).click();
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Revisar minha solicitação' }).click();
		await expect(dialog).toBeHidden();
		await expect(page.getByRole('heading', { name: 'Identificação da Demanda' })).toBeVisible();
		expect(requests).toHaveLength(1);

		await nextButton(page).click();
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Criar mesmo assim' }).click();
		await expect(dialog).toBeHidden();
		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();
		expect(requests).toHaveLength(1);
	});

	test('alta não expõe Protocolo, score, total nem o publicId dos itens', async ({ page }) => {
		await mockDuplicateRoutes(page, { check: 'high' });
		await openDemandStep(page);

		await nextButton(page).click();

		const dialog = page.getByRole('dialog', { name: 'Possível duplicidade' });
		await expect(dialog).toBeVisible();
		await expect(dialog).not.toContainText('Protocolo');
		await expect(dialog).not.toContainText('Score');
		await expect(dialog).not.toContainText('Total');
		for (const item of DUPLICATE_RESPONSES.high.items) {
			await expect(dialog).not.toContainText(item.publicId);
		}
	});

	test('média mostra Características em comum inline com aria-live e não bloqueia', async ({
		page
	}) => {
		const requests = checkRequests(page);
		await mockDuplicateRoutes(page, { check: 'medium' });
		await openDemandStep(page);

		await nextButton(page).click();

		const alert = page.getByRole('region', { name: 'Características em comum' });
		await expect(alert).toBeVisible();
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.getByRole('heading', { name: 'Características em comum' })).toBeVisible();
		await expect(alert.locator('ul > li')).toHaveCount(4);
		await expect(alert.locator('xpath=ancestor::*[@aria-live="polite"]')).toHaveCount(1);
		await expect(page.getByRole('heading', { name: 'Identificação da Demanda' })).toBeVisible();
		expect(requests).toHaveLength(1);

		const storedDraft = await page.evaluate(() =>
			localStorage.getItem('maat:solicitation-form:draft')
		);
		expect(storedDraft).not.toBeNull();
		expect(storedDraft).not.toContain('confidence');
		expect(storedDraft).not.toContain('Características em comum');

		await nextButton(page).click();

		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();
		await expect(alert).toBeHidden();
		expect(requests).toHaveLength(1);
	});

	test('nenhuma resposta não renderiza o bloco e permite continuar', async ({ page }) => {
		const requests = checkRequests(page);
		await mockDuplicateRoutes(page, { check: 'none' });
		await openDemandStep(page);

		await nextButton(page).click();

		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();
		await expect(page.getByText('Possível duplicidade')).toHaveCount(0);
		await expect(page.getByText('Características em comum')).toHaveCount(0);
		expect(requests).toHaveLength(1);
	});

	test('erro 500 degrada e permite continuar', async ({ page }) => {
		const requests = checkRequests(page);
		await mockDuplicateRoutes(page, { check: 'error' });
		await openDemandStep(page);

		await nextButton(page).click();

		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.getByText('Possível duplicidade')).toHaveCount(0);
		await expect(page.getByText('Características em comum')).toHaveCount(0);
		expect(requests).toHaveLength(1);
	});

	test('erro de rede degrada e permite continuar', async ({ page }) => {
		const requests = checkRequests(page);
		await page.route(DUPLICATE_CHECK_ROUTE, (route) => route.abort('failed'));
		await openDemandStep(page);

		await nextButton(page).click();

		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.getByText('Possível duplicidade')).toHaveCount(0);
		expect(requests).toHaveLength(1);
	});

	test('alta revisada bloqueia a saída pelo stepper até criar mesmo assim', async ({ page }) => {
		let scenario: 'none' | 'high' = 'none';

		await page.route(DUPLICATE_CHECK_ROUTE, async (route) => {
			if (route.request().method() !== 'POST') {
				await route.fallback();
				return;
			}

			const response = scenario === 'high' ? DUPLICATE_RESPONSES.high : DUPLICATE_RESPONSES.none;

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(response)
			});
		});

		await openDemandStep(page);
		await nextButton(page).click();
		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();

		await page.getByRole('button', { name: /Etapa 2: Demanda/ }).click();
		scenario = 'high';
		await nextButton(page).click();

		const dialog = page.getByRole('dialog', { name: 'Possível duplicidade' });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Revisar minha solicitação' }).click();
		await expect(dialog).toBeHidden();

		// Volta para a etapa 1 e tenta saltar direto para a 3 pelo stepper.
		await page.getByRole('button', { name: /Etapa 1: Identificação/ }).click();
		await page.getByRole('button', { name: /Etapa 3: Operacional/ }).click();
		await expect(dialog).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Identificação da Demanda' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeHidden();

		await dialog.getByRole('button', { name: 'Criar mesmo assim' }).click();
		await expect(dialog).toBeHidden();
		await expect(page.getByRole('heading', { name: 'Informações Operacionais' })).toBeVisible();
	});
});
