<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AssetImage from '$lib/components/AssetImage.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getHomePath, has, hasAny } from '$lib/services/access.service';
	import { PORTAL_ACCESS_KEYS } from '$lib/types/permission';
	import { logout } from '$lib/services/auth.service';
	import { clearDraft } from '$lib/services/solicitation-draft.service';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { isOpen = false, onClose }: Props = $props();

	type NavHref = ReturnType<typeof resolve>;

	interface NavItem {
		name: string;
		icon: IconName;
		href: NavHref;
		exact?: boolean;
	}

	const PUBLIC_HOME_PATH = resolve('/');
	const NEW_REQUEST_PATH = resolve('/(public)/solicitacao');
	const TRACKING_PATH = resolve('/(public)/acompanhar');
	const QUEUE_PATH = resolve('/(admin)/fila');
	const DASHBOARD_PATH = resolve('/(admin)/dashboard');
	const LOGS_PATH = resolve('/(admin)/historico-de-logs');
	const USERS_PATH = resolve('/(admin)/usuarios');
	const SETTINGS_PATH = resolve('/(admin)/configuracoes');
	const LOGIN_PATH = resolve('/(public)/login');

	const currentUser = $derived(page.data.user);
	const appConfig = $derived(page.data.portalConfig);
	// A home segue a prioridade de permissões do access service (fila, dashboard,
	// usuários, configurações, acompanhamento) e cai no portal público.
	const homeHref = $derived<NavHref>((getHomePath(currentUser) ?? PUBLIC_HOME_PATH) as NavHref);

	const navItems = $derived.by((): NavItem[] => {
		const items: NavItem[] = [
			{ name: 'Portal', icon: 'home', href: homeHref, exact: homeHref === PUBLIC_HOME_PATH }
		];

		if (has('request:create', currentUser)) {
			items.push({ name: 'Nova Solicitação', icon: 'addCircle', href: NEW_REQUEST_PATH });
		}

		if (has('request:track', currentUser)) {
			items.push({ name: 'Acompanhamento', icon: 'search', href: TRACKING_PATH });
		}

		if (has('queue:read', currentUser)) {
			items.push({ name: 'Fila Centralizada', icon: 'centralQueue', href: QUEUE_PATH });
		}

		if (has('reports:read', currentUser)) {
			items.push({ name: 'Dashboard Gerencial', icon: 'queueChart', href: DASHBOARD_PATH });
		}

		if (has('audit:read', currentUser)) {
			items.push({ name: 'Histórico de Logs', icon: 'history', href: LOGS_PATH });
		}

		if (hasAny(['user:read', 'profile:read'], currentUser)) {
			items.push({ name: 'Gerenciar Usuários', icon: 'manageUsers', href: USERS_PATH });
		}

		if (hasAny(PORTAL_ACCESS_KEYS, currentUser)) {
			items.push({ name: 'Configurações', icon: 'settings', href: SETTINGS_PATH });
		}

		return items;
	});

	function isItemActive(item: NavItem, pathname: string): boolean {
		if (item.exact) return pathname === item.href;
		return pathname === item.href || pathname.startsWith(`${item.href}/`);
	}

	let isLoggingOut = $state(false);

	async function handleLogout() {
		if (isLoggingOut) return;

		onClose?.();
		isLoggingOut = true;

		try {
			clearDraft(currentUser?.id ?? null);
			await logout();
			await goto(LOGIN_PATH, { invalidateAll: true });
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<aside id="app-sidebar" class="sidebar" class:open={isOpen} aria-label="Navegação principal">
	<a class="sidebar__brand" href={homeHref} onclick={onClose}>
		<span class="sidebar__logo">
			<AssetImage
				lightSrc={appConfig.assets.logoLightUrl}
				darkSrc={appConfig.assets.logoDarkUrl}
				alt={appConfig.platformName}
				tint={appConfig.assets.logoUsePrimaryColor}
				width={28}
				height={28}
			/>
		</span>
		<span class="sidebar__brand-text">
			<span class="sidebar__brand-title">Portal {appConfig.platformName}</span>
			<span class="sidebar__brand-subtitle">Admin Suite</span>
		</span>
	</a>

	<nav class="sidebar__nav" aria-label="Menu">
		{#each navItems as item (item.name)}
			{@const active = isItemActive(item, page.url.pathname)}
			<a
				class="sidebar__item"
				class:active
				href={item.href}
				aria-current={active ? 'page' : undefined}
				onclick={onClose}
			>
				<Icon iconName={item.icon} iconSize="md" />
				<span>{item.name}</span>
			</a>
		{/each}
	</nav>

	{#if currentUser}
		<div class="sidebar__footer">
			<button
				class="sidebar__item"
				type="button"
				disabled={isLoggingOut}
				aria-busy={isLoggingOut}
				onclick={handleLogout}
			>
				<Icon iconName="logout" iconSize="md" />
				<span>Sair</span>
			</button>
		</div>
	{/if}
</aside>

{#if isOpen}
	<button class="sidebar__backdrop" type="button" aria-label="Fechar menu" onclick={onClose}
	></button>
{/if}

<style>
	.sidebar {
		position: sticky;
		top: 0;

		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);

		width: 248px;
		height: 100dvh;
		flex-shrink: 0;

		padding: var(--spacing-lg) var(--spacing-md);

		background-color: var(--white);
		color: var(--text-color-primary);
		border-right: var(--border-default);

		overflow-y: auto;
	}

	.sidebar__brand {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);

		padding: 0 var(--spacing-sm);

		color: inherit;
		text-decoration: none;
		border-radius: var(--radius-md);
	}

	.sidebar__brand:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.sidebar__logo {
		display: flex;
		align-items: center;
		justify-content: center;

		width: 44px;
		height: 44px;
		flex-shrink: 0;

		border-radius: var(--radius-md);
		background-color: var(--background-color);
	}

	.sidebar__brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}

	.sidebar__brand-title {
		font: var(--h4);
		color: var(--text-color-primary);
	}

	.sidebar__brand-subtitle {
		font: var(--label);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-color-secondary);
	}

	.sidebar__nav {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		flex: 1;
	}

	.sidebar__item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);

		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);

		border: none;
		border-radius: var(--radius-md);
		background: none;

		color: var(--text-color-secondary);
		font: var(--button);
		font-weight: 500;
		text-align: left;
		text-decoration: none;

		cursor: pointer;
		transition: var(--transition-default);
	}

	.sidebar__item:hover,
	.sidebar__item:focus-visible {
		background-color: var(--tint);
		color: var(--primary-color);
	}

	.sidebar__item:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.sidebar__item.active {
		background-color: var(--secondary-color);
		color: var(--on-primary);
	}

	.sidebar__item:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.sidebar__footer {
		margin-top: auto;
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}

	.sidebar__backdrop {
		display: none;
	}

	@media (max-width: 1024px) {
		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 60;

			visibility: hidden;
			transform: translateX(-100%);
			transition:
				transform 0.3s ease-in-out,
				visibility 0s linear 0.3s;
		}

		.sidebar.open {
			visibility: visible;
			transform: translateX(0);
			transition:
				transform 0.3s ease-in-out,
				visibility 0s linear 0s;
		}

		.sidebar__backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 55;

			border: none;
			background-color: rgba(0, 0, 0, 0.45);
			cursor: pointer;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar {
			transition: none;
		}
	}
</style>
