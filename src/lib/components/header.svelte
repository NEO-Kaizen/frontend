<script lang="ts">
	import Icon from './icons.svelte';
	import type { IconName } from '$lib/types/icons';
	import { page } from '$app/state';

	type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

	interface User {
		name: string;
		userType: UserType;
	}
	interface NavButton {
		name: string;
		icon: IconName;
		//Opcional até ter as rotas definidas
		href?: string;
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
			<svg
				width="80"
				height="29"
				viewBox="0 0 80 29"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M80 14.6597C80 17.7719 79.5449 20.4056 78.3246 22.5887C77.114 24.7719 75.3931 26.492 73.2985 27.644C71.2134 28.7867 69.2008 28.9005 66.5969 28.9005C63.9737 28.9005 61.6196 28.7434 59.5346 27.5914C57.4495 26.4395 55.8016 24.7719 54.5909 22.5887C53.3802 20.4056 52.7749 17.7626 52.7749 14.6597C52.7749 11.5475 53.3802 8.89986 54.5909 6.7167C55.8016 4.53354 57.4495 2.87062 59.5346 1.72795C61.6196 0.575982 63.9737 0 66.5969 0C69.2008 0 71.5453 0.575982 73.6304 1.72795C75.7251 2.87062 77.114 4.53354 78.3246 6.7167C79.5449 8.89986 80 11.5475 80 14.6597ZM74.0916 14.6597C74.0916 12.6437 73.923 11.0177 73.2985 9.63351C72.6835 8.24929 71.9096 6.99806 70.7854 6.28272C69.6612 5.56739 68.1054 5.02618 66.5969 5.02618C65.0883 5.02618 63.5326 5.56739 62.4084 6.28272C61.2842 6.99806 60.5199 7.83044 59.8953 9.21466C59.2804 10.5989 58.6388 12.6437 58.6388 14.6597C58.6388 16.6756 58.8615 18.3016 59.4765 19.6859C60.101 21.0701 61.5235 22.1939 62.6477 22.9092C63.772 23.6246 65.0883 23.9822 66.5969 23.9822C68.1054 23.9822 69.4218 23.6246 70.546 22.9092C71.6702 22.1939 72.5398 21.1441 73.1548 19.7599C73.7793 18.3757 74.0916 16.6756 74.0916 14.6597Z"
					fill="#00236F"
				/>
				<path
					d="M28.184 28.2235L28.1479 0.456276L48.7313 0.456283V5.14969H33.6627V11.4382H47.5833V15.9163H33.508V23.4555H49.4242V28.2235H28.184Z"
					fill="#00236F"
				/>
				<path
					d="M22.199 0.418849V28.2317H16.3351L5.44503 10.0524V28.2024H0.116921L0 0.392876H5.3314L17.1728 19.267V0.418808L22.199 0.418849Z"
					fill="#00236F"
				/>
			</svg>
		</div>
		<div class="top_bar-interactables">
			<form class="search-container">
				<button type="submit">
					<Icon iconName="search" />
				</button>
				<input type="text" placeholder="Buscar chamados..." name="pesquisar" />
			</form>
			<button>Placeholder nova solicitação</button>
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
				<button>Placeholder Acesso administrativo</button>
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
		border-right: var();
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
