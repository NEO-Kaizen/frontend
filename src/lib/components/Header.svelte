<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons';
	import { page } from '$app/state';
	import Button from './Button.svelte';
	import logo from '$lib/assets/NEO-logo.svg';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';

	type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

	interface User {
		name: string;
		userType: UserType;
	}
	interface NavButton {
		name: string;
		icon: IconName;
		//Opcional até ter as rotas definidas
		href?: RouteId;
	}

	// Nome e usertype devem ser pegas pela Data da página, ambas implementaçãos são um mock muito básico
	// Alterar o mock para um próximo do real de pois de ver melhor sveltekit

	const user: User = {
		name: 'André Job',
		userType: 'Administrador'
	};

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

	const isNotSolicitante = user.userType !== 'Solicitante';
</script>

<header>
	<div class="top_bar">
		<div class="top_bar-logo">
			<img width="80" height="29" alt="NEO_LOGO" src={logo} />
		</div>
		<div class="top_bar-interactables">
			<form class="search-container">
				<button type="submit">
					<Icon iconName="search" />
				</button>
				<input type="text" placeholder="Buscar chamados..." name="pesquisar" />
			</form>
			<Button>
				<span>+</span>
				Nova solicitação
			</Button>
			{#if isNotSolicitante}
				<div class="separator_bar-collumn"></div>
				<div class="profile_block">
					<div class="profile_block-identification">
						<p class="profile_block-name">{user.name}</p>
						<p class="profile_block-role">{user.userType}</p>
					</div>
					<img
						src="https://images.icon-icons.com/1238/PNG/512/blacksquare_83753.png"
						alt="imagem do usuário"
					/>
				</div>
			{:else}
				<Button variant="outline">
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
				{#each navItems[user.userType] as item (item.name)}
					<div class="nav-item" class:active={page.url.pathname === item.href}>
						<Icon iconName={item.icon} />
						<a href={item.href}>{item.name}</a>
					</div>
				{/each}
			</div>
			<div class="nav-item">
				<Icon iconName="logout" />
				Sair
			</div>
		</div>
	{/if}
</header>

<style>
	* {
		padding: 0;
		margin: 0;
	}
	header {
		display: flex;
		flex-direction: column;
		width: 90vw;
		margin: auto;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		background-color: var(--white);
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-xl);
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
	}
	.top_bar .search-container {
		display: flex;
		align-items: center;
		background: var(--white);
		border-radius: var(--radius-md);
		border: var(--border-default);
		width: 300px;
	}

	.top_bar .search-container input[type='text'] {
		padding: 6px 10px;
		font: var(--paragrafo);
		border: none;
		outline: none;
		background: transparent;
		color: var(--black);
	}

	.top_bar .search-container button {
		padding: 6px 10px;
		height: 100%;
		background: var(--white);
		border: none;
		cursor: pointer;
		font: 15px;
		display: flex;
		align-items: center;
		border-top-left-radius: var(--radius-md);
		border-bottom-left-radius: var(--radius-md);
	}

	.top_bar .search-container button:hover {
		background: var(--white-gray);
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
		font: var(--paragrado);
		font-weight: 500;
	}
	.profile_block-role {
		font: var(--paragrado);
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
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		transition: var(--transition-default);
		border-radius: var(--radius-md);
	}
	.nav-item:hover,
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

	.separator_bar-collumn {
		background-color: var(--white-gray);
		width: 1px;
	}
</style>
