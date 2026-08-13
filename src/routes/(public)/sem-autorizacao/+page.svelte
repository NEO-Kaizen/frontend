<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<main class="content-container">
	<section class="blocked">
		<h1>Acesso negado</h1>
		<p>Você não tem autorização para acessar esta página. Efetue o login para continuar.</p>
		<a class="login-link" href={resolve('/(public)/login')}>Fazer login</a>
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

	.login-link {
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--primary-color);
		color: var(--white);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 500;
		transition: var(--transition-default);
	}

	.login-link:hover {
		background-color: var(--secondary-color);
	}

	.login-link:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}
</style>
