<script lang="ts">
	import Icon from './Icon.svelte';
	import AssetImage from './AssetImage.svelte';
	import type { IconName } from '$lib/types/icons';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Input from './Input.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
	import { logout } from '$lib/services/auth.service';
	import { clearDraft } from '$lib/services/solicitation-draft.service';
	import { searchRequests } from '$lib/services/request.service';
	import { hasAny } from '$lib/services/access.service';
	import {
		OPERATIONAL_AREA_KEYS,
		PORTAL_ACCESS_KEYS,
		QUEUE_SEARCH_KEYS,
		type PermissionKey
	} from '$lib/types/permission';
	import { onMount } from 'svelte';
	import { getThemeMode, toggleTheme } from '$lib/states/theme.svelte';
	import { resolveApiAssetUrl } from '$lib/utils/api-assets';

	const NAV_ROUTES = {
		home: '/(admin)/home',
		queue: '/(admin)/fila',
		dashboard: '/(admin)/dashboard',
		logs: '/(admin)/historico-de-logs',
		users: '/(admin)/usuarios',
		settings: '/(admin)/configuracoes'
	} as const satisfies Record<string, RouteId>;

	const NAV_PATHS = {
		home: resolve(NAV_ROUTES.home),
		queue: resolve(NAV_ROUTES.queue),
		dashboard: resolve(NAV_ROUTES.dashboard),
		logs: resolve(NAV_ROUTES.logs),
		users: resolve(NAV_ROUTES.users),
		settings: resolve(NAV_ROUTES.settings)
	} as const;

	type NavRoute = (typeof NAV_ROUTES)[keyof typeof NAV_ROUTES];

	interface NavButton {
		name: string;
		icon: IconName;
		keys: readonly PermissionKey[];
		route: NavRoute;
		// Sem rota associada: item exibido como indisponível, sem link.
		disabled?: boolean;
	}

	const currentUser = $derived(page.data.user);
	const appConfig = $derived(page.data.portalConfig);
	const queuePath = NAV_PATHS.queue;
	const isAuthenticated = $derived(currentUser != null);
	const userAvatarUrl = $derived(resolveApiAssetUrl(currentUser?.avatarUrl));

	// `isMounted` evita divergência de hidratação: no SSR o modo é sempre o
	// claro; no cliente o valor real vem do localStorage/sistema.
	let isMounted = $state(false);
	onMount(() => {
		isMounted = true;
	});
	const isDarkTheme = $derived(isMounted && getThemeMode() === 'dark');

	function isActive(item: NavButton, pathname: string): boolean {
		const href = resolve(item.route);
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	const navCatalog: readonly NavButton[] = [
		{
			name: 'Home',
			icon: 'home',
			keys: ['queue:read'],
			route: NAV_ROUTES.home
		},
		{
			name: 'Fila Centralizada',
			icon: 'centralQueue',
			keys: ['queue:read'],
			route: NAV_ROUTES.queue
		},
		{
			name: 'Dashboard Gerencial',
			icon: 'queueChart',
			keys: ['reports:read'],
			route: NAV_ROUTES.dashboard
		},
		{
			name: 'Histórico de Logs',
			icon: 'history',
			keys: ['audit:read'],
			route: NAV_ROUTES.logs
		},
		{
			name: 'Usuários e Perfis',
			icon: 'manageUsers',
			keys: ['user:read', 'profile:read'],
			route: NAV_ROUTES.users
		},
		{
			name: 'Configurações',
			icon: 'settings',
			keys: PORTAL_ACCESS_KEYS,
			route: NAV_ROUTES.settings
		}
	];

	const navItems = $derived(navCatalog.filter((item) => hasAny(item.keys, currentUser)));

	const hasOperationalAccess = $derived(hasAny(OPERATIONAL_AREA_KEYS, currentUser));

	// Perfis administrativos (ex.: só `user:read`/`profile:read`) não têm
	// `queue:read`; redirecioná-los para a fila cairia em /sem-autorizacao.
	const canSearchQueue = $derived(hasAny(QUEUE_SEARCH_KEYS, currentUser));

	const activeSearch = $derived(page.url.searchParams.get('search') ?? '');

	// Na tela de configurações o editor de tema controla a pré-visualização
	// localmente; o toggle global fica oculto para não competir com ele.
	const isSettingsPage = $derived(page.url.pathname.startsWith(NAV_PATHS.settings));

	let isSearching = $state(false);

	async function handleSearchSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (isSearching) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const value = String(formData.get('pesquisar-chamados') ?? '').trim();

		if (!value) return;

		isSearching = true;

		try {
			if (canSearchQueue) {
				const searchParams = new URLSearchParams({ search: value });

				// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
				// a navegação é validada em runtime pelo SvelteKit.
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(`${queuePath}?${searchParams.toString()}`);
				return;
			}

			const result = await searchRequests(value);

			if (!result.ok) {
				console.error(result.error.message);
				return;
			}

			if ('protocol' in result.data) {
				await goto(
					resolve('/(public)/acompanhar/[protocolo]', {
						protocolo: result.data.protocol
					})
				);
				return;
			}

			const searchParams = new URLSearchParams({ email: value });

			// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
			// a navegação é validada em runtime pelo SvelteKit.
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(`${resolve('/(public)/acompanhar')}?${searchParams.toString()}`);
		} finally {
			isSearching = false;
		}
	}

	let isLoggingOut = $state(false);

	async function handleLogout() {
		if (isLoggingOut) return;

		isLoggingOut = true;

		try {
			clearDraft(currentUser?.id ?? null);
			await logout();
			await goto(resolve('/(public)/login'), { invalidateAll: true });
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<header>
	<div class="top_bar">
		<a class="top_bar-logo" href={resolve('/')}>
			<AssetImage
				lightSrc={appConfig.assets.logoLightUrl}
				darkSrc={appConfig.assets.logoDarkUrl}
				alt={appConfig.platformName}
				tint={appConfig.assets.logoUsePrimaryColor}
				width={123}
				height={37}
			/>
		</a>

		<div class="top_bar-interactables">
			<form role="search" class="search-container" onsubmit={handleSearchSubmit}>
				<Input
					type="search"
					placeholder="Buscar solicitação"
					aria-label="Buscar solicitação"
					name="pesquisar-chamados"
					value={activeSearch}
					disabled={isSearching}
					actionIcon="search"
					actionLabel="Buscar"
					onAction={() => {
						const form = document.querySelector('form[role="search"]') as HTMLFormElement | null;
						form?.requestSubmit();
					}}
				/>
			</form>

			<Button
				variant="primary"
				onclick={() => {
					goto(resolve('/(public)/solicitacao'));
				}}
			>
				<span>+</span> Nova solicitação
			</Button>

			{#if !isSettingsPage}
				<button
					class="theme-toggle"
					type="button"
					aria-label={isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
					title={isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
					onclick={toggleTheme}
				>
					<Icon iconName={isDarkTheme ? 'lightMode' : 'darkMode'} />
				</button>
			{/if}

			{#if isAuthenticated}
				<div class="separator_bar-column"></div>

				<a
					class="profile_block"
					href={resolve('/(app)/perfil')}
					aria-label="Abrir meus dados"
					title="Meus dados"
				>
					<div class="profile_block-identification">
						<p class="profile_block-name">{currentUser?.name}</p>
						<p class="profile_block-role">{currentUser?.role}</p>
					</div>
					<span class="profile_block-avatar">
						{#if userAvatarUrl}
							<img
								src={userAvatarUrl}
								alt={`Foto de perfil de ${currentUser?.name ?? 'usuário'}`}
							/>
						{:else}
							<AssetImage
								lightSrc={appConfig.assets.avatarLightUrl}
								darkSrc={appConfig.assets.avatarDarkUrl}
								alt="Imagem de perfil padrão"
								width="100%"
								height="100%"
							/>
						{/if}
					</span>
				</a>
			{:else}
				<Button
					variant="outline"
					onclick={() => {
						goto(resolve('/(public)/login'));
					}}
				>
					<Icon iconName="login" />
					Acessar
				</Button>
			{/if}
		</div>
	</div>

	{#if hasOperationalAccess || navItems.length > 0}
		<div class="separator_bar"></div>

		<div class="nav">
			<div class="nav-items-group">
				{#each navItems as item (item.name)}
					{#if item.disabled}
						<div class="nav-item inactive" aria-disabled="true">
							<Icon iconName={item.icon} />
							<span>{item.name}</span>
						</div>
					{:else}
						<a
							class={['nav-item', { active: isActive(item, page.url.pathname) }]}
							href={resolve(item.route)}
						>
							<Icon iconName={item.icon} />
							<span>{item.name}</span>
						</a>
					{/if}
				{/each}
			</div>

			<button
				class="nav-item"
				type="button"
				disabled={isLoggingOut}
				aria-busy={isLoggingOut}
				onclick={handleLogout}
			>
				<Icon iconName="logout" />
				Sair
			</button>
		</div>
	{:else if isAuthenticated}
		<div class="separator_bar"></div>

		<div class="nav">
			<button
				class="nav-item"
				type="button"
				disabled={isLoggingOut}
				aria-busy={isLoggingOut}
				onclick={handleLogout}
			>
				<Icon iconName="logout" />
				Sair
			</button>
		</div>
	{/if}
</header>

<style>
	header {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--white);
		border-radius: var(--radius-xl);
		max-width: var(--largura-maxima-header);
	}
	.top_bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.top_bar-logo {
		color: var(--primary-color);
		width: 123px;
		font: var(--h1);
		display: flex;
	}
	.top_bar-interactables {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}
	.search-container {
		width: 300px;
	}

	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: var(--border-default);
		border-radius: 100%;
		background-color: transparent;
		color: var(--primary-color);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.theme-toggle:hover,
	.theme-toggle:focus-visible {
		background-color: var(--tint);
	}

	.profile_block {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0 var(--spacing-md);
	}
	.profile_block-avatar {
		display: inline-flex;
		width: 47px;
		height: 47px;
		border-radius: 100%;
		overflow: hidden;
		flex-shrink: 0;
	}
	.profile_block-avatar :global(img),
	.profile_block-avatar :global(.asset-tint) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.profile_block-identification {
		display: flex;
		flex-direction: column;
		align-items: end;
	}
	.profile_block-name {
		font: var(--paragrafo);
		font-weight: 500;
	}
	.profile_block-role {
		font: var(--paragrafo);
		font-size: 14px;
	}

	.nav {
		display: flex;
		justify-content: space-between;
		color: var(--primary-color);
	}
	.nav-items-group {
		display: flex;
		gap: var(--spacing-sm);
	}
	button.nav-item {
		background: none;
		border: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		transition: var(--transition-default);
		border-radius: var(--radius-md);
	}
	.nav-item:not(.inactive):hover,
	.nav-item:focus-visible,
	.nav-item.active {
		background-color: var(--primary-color);
		color: var(--on-primary);
	}
	.nav-item:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.nav-item.inactive {
		cursor: not-allowed;
		opacity: 0.6;
	}

	a {
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.separator_bar {
		height: 1px;
		background-color: var(--white-gray);
	}

	.separator_bar-column {
		background-color: var(--white-gray);
		width: 1px;
		align-self: stretch;
	}
</style>
