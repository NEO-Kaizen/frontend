import { expect, test } from '@playwright/test';
import {
	DUPLICATE_ERROR,
	__resetDuplicateMockScenario,
	__setDuplicateMockScenario,
	checkDuplicatesMock,
	getTrackingDuplicatesMock
} from '../../src/lib/mocks/duplicate.mock';
import {
	DUPLICATE_DEMAND,
	DUPLICATE_ITEM_KEYS,
	DUPLICATE_ITEMS,
	DUPLICATE_RESPONSES
} from './support/duplicates';

const DEMAND_FIELDS = [
	'title',
	'requestType',
	'category',
	'processName',
	'description',
	'problem',
	'expectedResult',
	'justification'
];

test.describe('RF16 — fixtures de duplicidade', () => {
	test('cobrem as faixas high, medium e none', () => {
		expect(DUPLICATE_RESPONSES.high.confidence).toBe('high');
		expect(DUPLICATE_RESPONSES.medium.confidence).toBe('medium');
		expect(DUPLICATE_RESPONSES.none).toEqual({ confidence: 'none', items: [] });

		expect(DUPLICATE_RESPONSES.high.items.length).toBeLessThanOrEqual(3);
		expect(DUPLICATE_RESPONSES.medium.items.length).toBeLessThanOrEqual(5);
	});

	test('itens expõem somente as seis chaves públicas do contrato', () => {
		for (const item of Object.values(DUPLICATE_ITEMS)) {
			expect(Object.keys(item).sort()).toEqual([...DUPLICATE_ITEM_KEYS].sort());
			expect(item.period).toMatch(/^\d{4}-Q[1-4]$/);
		}
	});

	test('cobrem solicitação aberta e concluída', () => {
		expect(DUPLICATE_ITEMS.open.status).toBe('Em andamento');
		expect(DUPLICATE_ITEMS.concluded.status).toBe('Concluída');
	});

	test('o bloco de Demanda de exemplo tem os oito campos do contrato', () => {
		expect(Object.keys(DUPLICATE_DEMAND).sort()).toEqual([...DEMAND_FIELDS].sort());
	});

	test('o fixture de erro usa a mensagem do backend', () => {
		expect(DUPLICATE_ERROR).toEqual({
			status: 'error',
			statusCode: 500,
			message: 'Erro interno do servidor'
		});
	});

	test('mocks de desenvolvimento respondem o cenário médio', async () => {
		await expect(checkDuplicatesMock()).resolves.toEqual(DUPLICATE_RESPONSES.medium);
		await expect(getTrackingDuplicatesMock()).resolves.toEqual(DUPLICATE_RESPONSES.medium);
	});

	test('mocks de desenvolvimento permitem escolher high, none e error', async () => {
		try {
			__setDuplicateMockScenario('high');
			await expect(checkDuplicatesMock()).resolves.toEqual(DUPLICATE_RESPONSES.high);

			__setDuplicateMockScenario('none');
			await expect(getTrackingDuplicatesMock()).resolves.toEqual(DUPLICATE_RESPONSES.none);

			__setDuplicateMockScenario('error');
			await expect(checkDuplicatesMock()).rejects.toMatchObject({
				status: DUPLICATE_ERROR.statusCode,
				message: DUPLICATE_ERROR.message
			});
		} finally {
			__resetDuplicateMockScenario();
		}
	});
});
