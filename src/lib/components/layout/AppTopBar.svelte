<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	import AssetImage from '$lib/components/AssetImage.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import { isInternalProfile } from '$lib/services/access.service';
	import { searchRequests } from '$lib/services/request.service';
	import { getThemeMode, toggleTheme } from '$lib/states/theme.svelte';
	import { resolveApiAssetUrl } from '$lib/utils/api-assets';

	interface Props {
		onMenu: () => void;
		showMenu?: boolean;
	}

	let { onMenu, showMenu = true }: Props = $props();

	const SETTINGS_PATH = resolve('/(admin)/configuracoes');
	const QUEUE_PATH = resolve('/(admin)/fila');
	const LOGIN_PATH = resolve('/(public)/login');
	const TRACKING_PATH = resolve('/(public)/acompanhar');
	const PROFILE_PATH = resolve('/(app)/perfil');

	const currentUser = $derived(page.data.user);
	const appConfig = $derived(page.data.portalConfig);
	const isAuthenticated = $derived(currentUser != null);
	const isInternal = $derived(currentUser != null && isInternalProfile(currentUser.role));
	const userAvatarUrl = $derived(resolveApiAssetUrl(currentUser?.avatarUrl));
	const activeSearch = $derived(page.url.searchParams.get('search') ?? '');
	const isSettingsPage = $derived(page.url.pathname.startsWith(SETTINGS_PATH));

	// `isMounted` evita divergência de hidratação: no SSR o modo é sempre o
	// claro; no cliente o valor real vem do localStorage/sistema.
	let isMounted = $state(false);
	onMount(() => {
		isMounted = true;
	});
	const isDarkTheme = $derived(isMounted && getThemeMode() === 'dark');

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
			if (isInternal) {
				const searchParams = new URLSearchParams({ search: value });

				// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
				// a navegação é validada em runtime pelo SvelteKit.
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(`${QUEUE_PATH}?${searchParams.toString()}`);
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
			await goto(`${TRACKING_PATH}?${searchParams.toString()}`);
		} finally {
			isSearching = false;
		}
	}
</script>

<header class="topbar">
	{#if showMenu}
		<button
			class="topbar__menu"
			type="button"
			aria-label="Abrir menu"
			aria-controls="app-sidebar"
			onclick={onMenu}
		>
			<Icon iconName="menu" iconSize="md" />
		</button>
	{/if}

	<form role="search" class="topbar__search" onsubmit={handleSearchSubmit}>
		<Input
			type="search"
			placeholder="Buscar solicitações..."
			aria-label="Buscar solicitações"
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

	<div class="topbar__actions">
		{#if isAuthenticated}
			<NotificationBell userId={currentUser?.id ?? null} />
		{/if}

		<button class="topbar__icon" type="button" aria-label="Ajuda" title="Ajuda (em breve)" disabled>
			<Icon iconName="help" iconSize="md" />
		</button>

		{#if !isSettingsPage}
			<button
				class="topbar__icon"
				type="button"
				aria-label={isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
				title={isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
				onclick={toggleTheme}
			>
				<Icon iconName={isDarkTheme ? 'lightMode' : 'darkMode'} iconSize="md" />
			</button>
		{/if}

		<span class="topbar__divider" aria-hidden="true"></span>

		{#if isAuthenticated}
			<a
				class="topbar__profile"
				href={PROFILE_PATH}
				aria-label="Abrir meus dados"
				title="Meus dados"
			>
				<span class="topbar__profile-text">
					<span class="topbar__profile-name">{currentUser?.name}</span>
					<span class="topbar__profile-role">{currentUser?.role}</span>
				</span>
				<span class="topbar__avatar">
					{#if userAvatarUrl}
						<img src={userAvatarUrl} alt={`Foto de perfil de ${currentUser?.name ?? 'usuário'}`} />
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
					goto(LOGIN_PATH);
				}}
			>
				<Icon iconName="login" iconSize="md" />
				Acessar
			</Button>
		{/if}
	</div>
</header>

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 40;

		display: flex;
		align-items: center;
		gap: var(--spacing-md);

		min-height: 72px;
		padding: var(--spacing-sm) var(--spacing-lg);

		background-color: var(--white);
		border-bottom: var(--border-default);
	}

	.topbar__menu {
		display: none;
		align-items: center;
		justify-content: center;

		width: 40px;
		height: 40px;
		flex-shrink: 0;

		border: none;
		border-radius: 100%;
		background: none;
		color: var(--text-color-secondary);

		cursor: pointer;
		transition: var(--transition-default);
	}

	.topbar__menu:hover,
	.topbar__menu:focus-visible {
		background-color: var(--tint);
		color: var(--primary-color);
	}

	.topbar__menu:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.topbar__search {
		flex: 1;
		max-width: 520px;
	}

	.topbar__actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-left: auto;
	}

	.topbar__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		width: 40px;
		height: 40px;
		flex-shrink: 0;

		border: none;
		border-radius: 100%;
		background: none;
		color: var(--text-color-secondary);

		cursor: pointer;
		transition: var(--transition-default);
	}

	.topbar__icon:hover:not(:disabled),
	.topbar__icon:focus-visible {
		background-color: var(--tint);
		color: var(--primary-color);
	}

	.topbar__icon:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.topbar__icon:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.topbar__divider {
		width: 1px;
		height: 32px;
		background-color: var(--white-gray);
	}

	.topbar__profile {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);

		padding: var(--spacing-xs) var(--spacing-sm);

		border-radius: var(--radius-md);
		color: inherit;
		text-decoration: none;
		transition: var(--transition-default);
	}

	.topbar__profile:hover,
	.topbar__profile:focus-visible {
		background-color: var(--tint);
	}

	.topbar__profile:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.topbar__profile-text {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.topbar__profile-name {
		font: var(--paragrafo);
		font-weight: 600;
		color: var(--text-color-primary);
	}

	.topbar__profile-role {
		font: var(--paragrafo);
		font-size: 13px;
		color: var(--text-color-secondary);
	}

	.topbar__avatar {
		display: inline-flex;
		width: 42px;
		height: 42px;
		flex-shrink: 0;

		border-radius: 100%;
		overflow: hidden;
	}

	.topbar__avatar :global(img),
	.topbar__avatar :global(.asset-tint) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (max-width: 1024px) {
		.topbar__menu {
			display: inline-flex;
		}
	}

	@media (max-width: 720px) {
		.topbar__profile-text {
			display: none;
		}

		.topbar__search {
			max-width: none;
		}
	}

	@media (max-width: 560px) {
		.topbar {
			gap: var(--spacing-sm);
			padding-inline: var(--spacing-md);
		}

		.topbar__divider {
			display: none;
		}
	}
</style>
