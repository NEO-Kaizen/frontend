<script lang="ts">
	import Icon from './icons.svelte';
	import type { IconName } from '$lib/types/icons';

	type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

    interface User {
        name: string;
        userType : UserType
    }
	interface NavButton {
		name: string;
		icon: IconName;
	}
	

    // Nome e usertype devem ser pegas pela Data da página, ambas implementaçãos são um mock muito básico
    // Alterar o mock para um próximo do real de pois de ver melhor sveltekit
    
	const user: User = {
		name: 'André Job',
		userType : 'Administrador'
	};

	const analistaNav: NavButton[] = [
		{
			name: 'Home',
			icon: 'home'
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
		<div class="top_bar-logo">NEO</div>
		<div class="top_bar-interactables">
			<form class="search-container">
				<button type="submit">
					<Icon iconName="search" />
				</button>
				<input type="text" placeholder="Buscar chamados..." name="pesquisar" />
			</form>
			<button>Placeholder nova solicitação</button>
			{#if isNotSolicitante}
				<div class="profile_block">
					<div class="profile_block-identification">
						<p>{user.name}</p>
                        
						<p>{user.userType}</p>
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
					<div class="nav-item">
						<Icon iconName={item.icon} />
						<a>{item.name}</a>
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
    *{
        padding: 0;
        margin: 0;
    }
	header {
		display: flex;
		flex-direction: column;
		width: 90vw;
		margin: auto;
		gap: 4px;
		padding: 20px, 24px;
	}
	.top_bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.top_bar-interactables {
		display: flex;
		gap: 20px;
	}
	.top_bar .search-container {
		display: flex; /* input + botão lado a lado */
		align-items: center;
		background: #e9e9e9; /* fundo do conjunto, como no exemplo */
		border-radius: 8px; /* toque mais moderno */
		overflow: hidden;
	}

	.top_bar .search-container input[type='text'] {
		padding: 6px 10px;
		font-size: 17px;
		border: none;
		outline: none;
		background: transparent;
		color: #000;
	}

	.top_bar .search-container button {
		padding: 6px 10px;
		background: #ddd;
		border: none;
		cursor: pointer;
		font-size: 17px;
		display: flex;
		align-items: center;
	}

	.top_bar .search-container button:hover {
		background: #ccc;
	}

    .profile_block {
        display: flex;
        align-items: center;
        gap: 6px;
    }
	.profile_block > img {
		height: 47px;
		border-radius: 100%;
	}
    .profile_block-identification{
        display: flex;
        flex-direction: column;
        align-items: end;

    }

	.nav {
		display: flex;
		justify-content: space-between;
	}
	.nav-items-group {
		display: flex;
		gap: 7px;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.separator_bar {
		height: 1px;
		background-color: lightgray;
	}
    
</style>
