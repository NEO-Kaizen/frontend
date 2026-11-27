<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AssetImage from '$lib/components/AssetImage.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { isInternalProfile } from '$lib/services/access.service';
	import { logout } from '$lib/services/auth.service';
	import { clearDraft } from '$lib/services/solicitation-draft.service';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		isOpen?: boolean;
		collapsed?: boolean;
		onClose?: () => void;
	}

	let { isOpen = false, collapsed = false, onClose }: Props = $props();

	type NavHref = ReturnType<typeof resolve>;

	interface NavItem {
		name: string;
		icon: IconName;
		href: NavHref;
		exact?: boolean;
	}

	const PUBLIC_HOME_PATH = resolve('/');
	const INTERNAL_HOME_PATH = resolve('/(admin)/home');
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
	const isInternal = $derived(currentUser != null && isInternalProfile(currentUser.role));
	const homeHref = $derived(isInternal ? INTERNAL_HOME_PATH : PUBLIC_HOME_PATH);

	const navItems = $derived.by((): NavItem[] => {
		const items: NavItem[] = [
			{ name: 'Portal', icon: 'home', href: homeHref, exact: !isInternal },
			{ name: 'Nova Solicitação', icon: 'addCircle', href: NEW_REQUEST_PATH },
			{ name: 'Acompanhamento', icon: 'search', href: TRACKING_PATH }
		];

		const role = currentUser?.role;
		if (!role || !isInternalProfile(role)) return items;

		items.push({ name: 'Fila Centralizada', icon: 'centralQueue', href: QUEUE_PATH });

		if (role === 'Gestor' || role === 'Administrador') {
			items.push({ name: 'Dashboard', icon: 'queueChart', href: DASHBOARD_PATH });
			items.push({ name: 'Histórico de Logs', icon: 'history', href: LOGS_PATH });
		}

		if (role === 'Administrador') {
			items.push({ name: 'Gerenciar Usuários', icon: 'manageUsers', href: USERS_PATH });
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

<aside
	id="app-sidebar"
	class="sidebar"
	class:open={isOpen}
	class:collapsed
	aria-label="Navegação principal"
>
	<div class="sidebar__header">
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

		<button class="sidebar__close" type="button" aria-label="Fechar menu" onclick={onClose}>
			<Icon iconName="close" iconSize="md" />
		</button>
	</div>

	<nav class="sidebar__nav" aria-label="Menu">
		{#each navItems as item (item.name)}
			{@const active = isItemActive(item, page.url.pathname)}
			<a
				class="sidebar__item"
				class:active
				href={item.href}
				title={collapsed ? item.name : undefined}
				aria-current={active ? 'page' : undefined}
				onclick={onClose}
			>
				<Icon iconName={item.icon} iconSize="md" />
				<span class="sidebar__item-label">{item.name}</span>
			</a>
		{/each}
	</nav>

	{#if currentUser}
		<div class="sidebar__footer">
			<button
				class="sidebar__item"
				type="button"
				title={collapsed ? 'Sair' : undefined}
				disabled={isLoggingOut}
				aria-busy={isLoggingOut}
				onclick={handleLogout}
			>
				<Icon iconName="logout" iconSize="md" />
				<span class="sidebar__item-label">Sair</span>
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

	.sidebar__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.sidebar__brand {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex: 1;
		min-width: 0;

		padding: 0 var(--spacing-sm);

		color: inherit;
		text-decoration: none;
		border-radius: var(--radius-md);
	}

	.sidebar__close {
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

	.sidebar__close:hover,
	.sidebar__close:focus-visible {
		background-color: var(--tint);
		color: var(--primary-color);
	}

	.sidebar__close:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
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

	@media (min-width: 1025px) {
		.sidebar {
			transition:
				width 0.25s ease-in-out,
				padding 0.25s ease-in-out;
		}

		.sidebar.collapsed {
			width: 76px;
			padding-inline: var(--spacing-sm);
		}

		.sidebar.collapsed .sidebar__brand {
			justify-content: center;
			padding: 0;
		}

		.sidebar.collapsed .sidebar__brand-text,
		.sidebar.collapsed .sidebar__item-label {
			display: none;
		}

		.sidebar.collapsed .sidebar__item {
			justify-content: center;
			padding-inline: 0;
		}
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

		.sidebar__close {
			display: inline-flex;
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
