import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtocolSearchCard from './ProtocolSearchCard.svelte';

const mocks = vi.hoisted(() => ({
	page: {
		data: {
			portalConfig: {
				protocolMask: 'MAAT'
			}
		}
	},
	goto: vi.fn()
}));

vi.mock('$app/state', () => ({ page: mocks.page }));
vi.mock('$app/navigation', () => ({ goto: mocks.goto }));
vi.mock('$app/paths', () => ({
	resolve: (route: string, params?: Record<string, string>) => {
		let path = route.replace(/\/\([^)]*\)/g, '');
		for (const [key, value] of Object.entries(params ?? {})) {
			path = path.replace(`[${key}]`, value);
		}
		return path;
	}
}));

describe('ProtocolSearchCard — feedback de erro', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('mostra erro seguro e reabilita a consulta quando a navegação falha', async () => {
		mocks.goto.mockRejectedValueOnce(new Error('navigation failed'));

		render(ProtocolSearchCard);

		await fireEvent.input(screen.getByLabelText('Número do Protocolo'), {
			target: { value: 'MAAT-8K3P-9X2M' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Consultar Protocolo' }));

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Não foi possível concluir a consulta. Tente novamente.'
		);
		expect(screen.getByRole('button', { name: 'Consultar Protocolo' })).not.toBeDisabled();
		expect(mocks.goto).toHaveBeenCalledWith('/acompanhar/MAAT-8K3P-9X2M');
	});
});
