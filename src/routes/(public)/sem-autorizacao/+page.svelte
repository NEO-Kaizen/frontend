<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getHomeRedirect } from '$lib/services/access.service';

	const user = $derived(page.data.user);

	const message = $derived(
		user
			? 'Você não tem permissão para acessar esta página. Se necessário, entre em contato com um administrador.'
			: 'Você não tem autorização para acessar esta página. Efetue o login para continuar.'
	);
</script>

<main class="content-container">
	<section class="blocked">
		<h1>Acesso negado</h1>
		<p>{message}</p>
		{#if user}
			{@const home = getHomeRedirect(user)}
			{#if home}
				<!-- O service retorna uma URL já resolvida, incluindo o base path. -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="action-link" href={home}>Voltar ao início</a>
			{:else}
				<a class="action-link" href={resolve('/')}>Voltar ao início</a>
			{/if}
		{:else}
			<a class="action-link" href={resolve('/(public)/login')}>Fazer login</a>
		{/if}
	</section>
</main>

<style>
	.blocked {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	.blocked p {
		color: var(--gray);
		max-width: 40ch;
	}

	.action-link {
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--primary-color);
		color: var(--white);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 500;
		transition: var(--transition-default);
	}

	.action-link:hover {
		background-color: var(--secondary-color);
	}

	.action-link:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}
</style>
