import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppTopBar from './AppTopBar.svelte';
import type { SessionUser } from '$lib/types/auth';

const mocks = vi.hoisted(() => ({
	page: {
		data: {
			user: null as SessionUser | null,
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
	hasAny: vi.fn(() => false),
	can: vi.fn(() => false),
	getThemeMode: vi.fn(() => 'light'),
	toggleTheme: vi.fn()
}));

vi.mock('$app/state', () => ({ page: mocks.page }));

vi.mock('$app/navigation', () => ({
	goto: mocks.goto
}));

vi.mock('$app/paths', () => ({
	resolve: (route: string, params?: Record<string, string>) => {
		let path = route.replace(/\/\([^)]*\)/g, '');
		for (const [key, value] of Object.entries(params ?? {})) {
			path = path.replace(`[${key}]`, value);
		}
		return path;
	}
}));

vi.mock('$lib/services/request.service', () => ({ searchRequests: mocks.searchRequests }));
vi.mock('$lib/services/access.service', () => ({ hasAny: mocks.hasAny, can: mocks.can }));
vi.mock('$lib/states/theme.svelte', () => ({
	getThemeMode: mocks.getThemeMode,
	toggleTheme: mocks.toggleTheme
}));
vi.mock('$lib/utils/api-assets', () => ({
	resolveApiAssetUrl: (url?: string | null) => url ?? ''
}));
vi.mock('$lib/components/NotificationBell.svelte', () => ({ default: () => null }));

const solicitante: SessionUser = {
	id: 'usuario-ficticio-1',
	name: 'Pessoa Fictícia',
	email: 'pessoa@exemplo.invalid',
	avatarUrl: null,
	role: 'Solicitante',
	isRoot: false,
	mustChangePassword: false,
	permissions: [{ key: 'request:track', custody: 'own' }]
};

const analista: SessionUser = {
	...solicitante,
	id: 'usuario-ficticio-2',
	role: 'Analista',
	permissions: [{ key: 'queue:read', custody: 'assigned' }]
};

const emptyPage = { data: [], page: 1, pageSize: 5, total: 0, totalPages: 0 };

function renderTopBar(user: SessionUser | null, canSearchQueue = false, canTrack = false) {
	mocks.page.data.user = user;
	mocks.page.url = new URL('http://localhost/');
	mocks.hasAny.mockReturnValue(canSearchQueue);
	mocks.can.mockReturnValue(canTrack);

	render(AppTopBar, {
		props: {
			onMenu: vi.fn(),
			onToggleSidebar: vi.fn(),
			showMenu: false
		}
	});
}

function searchInput() {
	return screen.getByRole('searchbox', { name: 'Buscar solicitações' });
}

async function submitSearch(term: string) {
	await fireEvent.input(searchInput(), { target: { value: term } });
	await fireEvent.submit(screen.getByRole('search'));
}

describe('AppTopBar — busca global', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.goto.mockResolvedValue(undefined);
		mocks.getThemeMode.mockReturnValue('light');
	});

	it('mostra alerta sem detalhes técnicos e repete a busca após falha transitória', async () => {
		mocks.searchRequests
			.mockResolvedValueOnce({
				ok: false,
				error: {
					status: 500,
					retryable: true,
					message: 'Não foi possível carregar as solicitações.'
				}
			})
			.mockResolvedValueOnce({ ok: true, data: emptyPage });

		renderTopBar(null);
		await submitSearch('pessoa@exemplo.invalid');

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Não foi possível carregar as solicitações.');
		expect(alert).not.toHaveTextContent('500');

		await fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

		await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
		expect(mocks.searchRequests).toHaveBeenCalledTimes(2);
		expect(mocks.searchRequests).toHaveBeenLastCalledWith('pessoa@exemplo.invalid');
		expect(mocks.goto).toHaveBeenCalledWith('/acompanhar?email=pessoa%40exemplo.invalid');
	});

	it('não oferece retry para erro de validação', async () => {
		mocks.searchRequests.mockResolvedValueOnce({
			ok: false,
			error: { retryable: false, message: 'Informe um protocolo ou e-mail válido.' }
		});

		renderTopBar(null);
		await submitSearch('sem-formato');

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Informe um protocolo ou e-mail válido.'
		);
		expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
	});

	it('mostra carregamento sem desabilitar o campo de busca', async () => {
		let resolveSearch!: (value: unknown) => void;
		mocks.searchRequests.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSearch = resolve;
			})
		);

		renderTopBar(null);
		const input = searchInput();
		input.focus();
		await submitSearch('pessoa@exemplo.invalid');

		expect(await screen.findByRole('status')).toHaveTextContent('Buscando…');
		expect(input).not.toBeDisabled();
		expect(document.activeElement).toBe(input);

		resolveSearch({ ok: true, data: emptyPage });
		await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
	});

	it('perfis internos navegam para a fila sem usar a busca pública', async () => {
		renderTopBar(analista, true);
		await submitSearch('termo interno');

		expect(mocks.searchRequests).not.toHaveBeenCalled();
		expect(mocks.goto).toHaveBeenCalledWith('/fila?search=termo+interno');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('esconde a busca para autenticado sem acesso à fila nem ao acompanhamento', async () => {
		renderTopBar({ ...solicitante, permissions: [] }, false, false);

		expect(screen.queryByRole('search')).not.toBeInTheDocument();
	});
});
