<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons';
	import { page } from '$app/state';
	import Button from './Button.svelte';
	import logo from '$lib/assets/NEO-logo.svg';
	import type { RouteId } from '$app/types';
	import type { UserType } from '$lib/types/user';
	import Input from './Input.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	interface NavButton {
		name: string;
		icon: IconName;
		//Opcional até ter as rotas definidas
		href?: RouteId;
	}

	const currentUser = $derived(page.data.user);

	const analistaNav: NavButton[] = [
		{
			name: 'Home',
			icon: 'home',
			//Mais para quesito de teste visual
			href: '/'
		},
		{
			name: 'Fila Centralizada',
			icon: 'centralQueue'
		}
	];

	const gestorNav: NavButton[] = [
		...analistaNav,
		{
			name: 'Histórico de Logs',
			icon: 'history'
		}
	];

	const adminNav: NavButton[] = [
		...gestorNav,
		{
			name: 'Gerenciar Usuários',
			icon: 'manageUsers'
		}
	];

	const navItems = {
		Analista: analistaNav,
		Gestor: gestorNav,
		Administrador: adminNav,
		Solicitante: []
	} satisfies Record<UserType, NavButton[]>;

	const isNotSolicitante = $derived(currentUser != null && currentUser.role !== 'Solicitante');

	function handleSearchSubmit(event: SubmitEvent) {
		event.preventDefault();
		// TODO: implementar a busca quando a feature existir
	}
</script>

<header>
	<div class="top_bar">
		<a class="top_bar-logo" href="/">
			<img width="80" height="29" alt="NEO" src={logo} />
		</a>
		<div class="top_bar-interactables">
			<form role="search" class="search-container" onsubmit={handleSearchSubmit}>
				<Input
					icon="search"
					type="search"
					placeholder="Buscar chamados"
					aria-label="Buscar chamados"
					name="pesquisar-chamados"
				/>
			</form>
			<Button>
				<span>+</span>
				Nova solicitação
			</Button>
			{#if isNotSolicitante}
				<div class="separator_bar-column"></div>
				<div class="profile_block">
					<div class="profile_block-identification">
						<p class="profile_block-name">{currentUser?.name}</p>
						<p class="profile_block-role">{currentUser?.role}</p>
					</div>
					<img
						src="https://images.icon-icons.com/1238/PNG/512/blacksquare_83753.png"
						alt="imagem do usuário"
					/>
				</div>
			{:else}
				<Button
					variant="outline"
					onclick={() => {
						goto(resolve('/login'));
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
					<div class="nav-item" class:active={page.url.pathname === item.href}>
						<Icon iconName={item.icon} />
						<a href={item.href ? resolve(item.href) : undefined}>{item.name}</a>
					</div>
				{/each}
			</div>
			<button class="nav-item" type="button">
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
		margin: auto;
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
		width: 80px;
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
	.nav-item:hover,
	.nav-item:has(a:focus-visible),
	.nav-item:focus-visible,
	.nav-item.active {
		background-color: var(--primary-color);
		color: var(--white);
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
