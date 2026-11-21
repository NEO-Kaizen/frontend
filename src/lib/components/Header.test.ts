import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header.svelte';

const mocks = vi.hoisted(() => ({
	page: {
		data: {
			user: null as unknown,
			portalConfig: {
				platformName: 'MAAT fictício',
				statuses: [],
				assets: {
					logoLightUrl: '/logo-light.svg',
					logoDarkUrl: '/logo-dark.svg',
					logoUsePrimaryColor: false,
					avatarLightUrl: '/avatar-light.svg',
					avatarDarkUrl: '/avatar-dark.svg'
				}
			}
		},
		url: new URL('http://localhost/')
	},
	searchRequests: vi.fn(),
	goto: vi.fn(),
	invalidate: vi.fn(),
	logout: vi.fn(),
	clearDraft: vi.fn(),
	toggleTheme: vi.fn()
}));

vi.mock('$app/state', () => ({ page: mocks.page }));

vi.mock('$app/navigation', () => ({
	goto: mocks.goto,
	invalidate: mocks.invalidate,
	invalidateAll: vi.fn()
}));

vi.mock('$app/paths', () => ({
	resolve: (route: string, params?: Record<string, string>) => {
		let path = route.replace(/\/\([^)]*\)/g, '');
		if (params?.protocolo) path = path.replace('[protocolo]', params.protocolo);
		return path;
	}
}));

vi.mock('$lib/services/request.service', () => ({ searchRequests: mocks.searchRequests }));
vi.mock('$lib/services/auth.service', () => ({ logout: mocks.logout }));
vi.mock('$lib/services/solicitation-draft.service', () => ({ clearDraft: mocks.clearDraft }));
vi.mock('$lib/states/theme.svelte', () => ({
	getThemeMode: () => 'light',
	toggleTheme: mocks.toggleTheme
}));
vi.mock('$lib/utils/api-assets', () => ({
	resolveApiAssetUrl: (url?: string | null) => url ?? ''
}));

const solicitante = {
	id: 'usuario-ficticio-1',
	name: 'Pessoa Fictícia',
	email: 'pessoa@exemplo.invalid',
	avatarUrl: null,
	role: 'Solicitante',
	mustChangePassword: false
};

const analista = { ...solicitante, id: 'usuario-ficticio-2', role: 'Analista' };

function renderHeader(user: unknown) {
	mocks.page.data.user = user;
	mocks.page.url = new URL('http://localhost/');
	render(Header);
}

async function submitSearch(term: string) {
	await fireEvent.input(screen.getByRole('searchbox', { name: 'Buscar solicitação' }), {
		target: { value: term }
	});
	await fireEvent.submit(screen.getByRole('search'));
}

describe('Header — busca pública e perfis', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('mostra alerta sem detalhes técnicos e repete a última busca ao falhar', async () => {
		mocks.searchRequests
			.mockResolvedValueOnce({
				ok: false,
				error: { status: 500, message: 'Não foi possível carregar as solicitações.' }
			})
			.mockResolvedValueOnce({
				ok: true,
				data: { data: [], page: 1, pageSize: 5, total: 0, totalPages: 0 }
			});

		renderHeader(solicitante);
		await submitSearch('MAAT-8K3P-9X2M');

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Não foi possível carregar as solicitações.');
		expect(alert).not.toHaveTextContent('500');

		await fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

		await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
		expect(mocks.searchRequests).toHaveBeenCalledTimes(2);
		expect(mocks.searchRequests).toHaveBeenLastCalledWith('MAAT-8K3P-9X2M');
		expect(mocks.goto).toHaveBeenCalledWith('/acompanhar?email=MAAT-8K3P-9X2M');
	});

	it('exibe mensagem segura quando a comunicação falha', async () => {
		mocks.searchRequests.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		renderHeader(solicitante);
		await submitSearch('termo qualquer');

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Não foi possível concluir a busca. Tente novamente.'
		);
	});

	it('perfis internos navegam para a fila sem usar a busca pública', async () => {
		renderHeader(analista);
		await submitSearch('termo interno');

		expect(mocks.searchRequests).not.toHaveBeenCalled();
		expect(mocks.goto).toHaveBeenCalledWith('/fila?search=termo+interno');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
