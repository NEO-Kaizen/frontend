<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import type { RouteId } from '$app/types';
	import type { UserType } from '$lib/types/user';
	import Input from './Input.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { logout } from '$lib/services/auth.service';
	import { searchRequests } from '$lib/services/request.service';

	// KNOWN ISSUE (svelte-check) — não estreitar este tipo sem entender a causa:
	// `resolve(item.href)` (no helper `isActive` e abaixo, no markup) acusa erro
	// porque o `RouteId` gerado inclui ids de diretórios sem página (ex.: pastas
	// `components/` da colocação de componentes) e `resolve()` usa tipo
	// condicional distributivo.
	// Falso-positivo: runtime e build passam; só o `check` fica vermelho.
	interface NavButton {
		name: string;
		icon: IconName;
		href?: RouteId;
		// Sem rota associada: item exibido como indisponível, sem link.
		disabled?: boolean;
	}

	const currentUser = $derived(page.data.user);
	const appConfig = $derived(page.data.portalConfig);

	function isActive(item: NavButton, pathname: string): boolean {
		if (!item.href) return false;
		const resolved = resolve(item.href);
		return pathname === resolved || pathname.startsWith(`${resolved}/`);
	}

	const analistaNav: NavButton[] = [
		{
			name: 'Home',
			icon: 'home',
			href: '/(admin)/home'
		},
		{
			name: 'Fila Centralizada',
			icon: 'centralQueue',
			href: '/(admin)/fila'
		}
	];

	const gestorNav: NavButton[] = [
		...analistaNav,
		{
			// 'Histórico de Logs' ainda não tem rota (prevista em outra issue)
			// (Sprint 4) — item cinza até a rota existir, impede link sem href.
			name: 'Histórico de Logs',
			icon: 'history',
			disabled: true
		}
	];

	const adminNav: NavButton[] = [
		...gestorNav,
		{
			name: 'Gerenciar Usuários',
			icon: 'manageUsers',
			href: '/(admin)/usuarios'
		},
		{
			name: 'Configurações',
			icon: 'settings',
			href: '/(admin)/configuracoes'
		}
	];

	const navItems = {
		Analista: analistaNav,
		Gestor: gestorNav,
		Administrador: adminNav,
		Solicitante: []
	} satisfies Record<UserType, NavButton[]>;

	const isNotSolicitante = $derived(currentUser != null && currentUser.role !== 'Solicitante');

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
			const result = await searchRequests(value, appConfig.protocolMask);

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
			<img width="123" height="37" alt={appConfig.platformName} src={appConfig.assets.logoUrl} />
		</a>

		<div class="top_bar-interactables">
			<form role="search" class="search-container" onsubmit={handleSearchSubmit}>
				<Input
					icon="search"
					type="search"
					placeholder="Buscar chamados"
					aria-label="Buscar chamados"
					name="pesquisar-chamados"
					disabled={isSearching}
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

			{#if isNotSolicitante}
				<div class="separator_bar-column"></div>

				<div class="profile_block">
					<div class="profile_block-identification">
						<p class="profile_block-name">{currentUser?.name}</p>
						<p class="profile_block-role">{currentUser?.role}</p>
					</div>
					<img src={appConfig.assets.avatarUrl} alt="Imagem do usuário" width="47" height="47" />
				</div>
			{:else}
				<Button
					variant="outline"
					onclick={() => {
						goto(resolve('/(public)/login'));
					}}
				>
					<Icon iconName="security" />
					Acesso administrativo
				</Button>
			{/if}
		</div>
	</div>

	{#if isNotSolicitante}
		<div class="separator_bar"></div>

		<div class="nav">
			<div class="nav-items-group">
				{#each navItems[currentUser?.role ?? 'Solicitante'] as item (item.name)}
					{#if item.disabled}
						<div class="nav-item inactive" aria-disabled="true">
							<Icon iconName={item.icon} />
							<span>{item.name}</span>
						</div>
					{:else}
						<div class="nav-item" class:active={isActive(item, page.url.pathname)}>
							<Icon iconName={item.icon} />
							<a href={item.href ? resolve(item.href) : undefined}>{item.name}</a>
						</div>
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
	{/if}
</header>

<style>
	header {
		display: flex;
		flex-direction: column;
		width: 90vw;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
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
		gap: var(--spacing-lg);
		align-items: center;
	}
	.search-container {
		width: 300px;
	}

	.profile_block {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0 var(--spacing-md);
	}
	.profile_block > img {
		height: 47px;
		border-radius: 100%;
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
		gap: var(--spacing-md);
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
	.nav-item:has(a:focus-visible),
	.nav-item:not(.inactive):focus-visible,
	.nav-item.active {
		background-color: var(--primary-color);
		color: var(--white);
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
