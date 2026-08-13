<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';

	const features: { routeId: RouteId; title: string; description: string }[] = [
		{
			routeId: '/(public)/login',
			title: 'Fazer login',
			description: 'Acesse sua área para acompanhar e atender solicitações.'
		},
		{
			routeId: '/(public)/solicitacao',
			title: 'Abrir solicitação',
			description: 'Registre uma nova solicitação sem precisar de login.'
		},
		{
			routeId: '/(public)/chamado',
			title: 'Verificar chamado',
			description: 'Acompanhe o status de um chamado pelo protocolo.'
		}
	];
</script>

<main class="content-container">
	<section class="hero">
		<h1>NEO</h1>
		<p>Potencializando a Gestão Inteligente de solicitações.</p>
	</section>

	<nav class="options" aria-label="Opções principais">
		{#each features as feature (feature.routeId)}
			<a class="option-card" href={resolve(feature.routeId)}>
				<h2>{feature.title}</h2>
				<p>{feature.description}</p>
			</a>
		{/each}
	</nav>
</main>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	.hero p {
		color: var(--gray);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-md);
	}

	.option-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		background-color: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
		text-decoration: none;
		color: var(--black);
		transition: var(--transition-default);
	}

	.option-card:hover {
		border-color: var(--primary-color);
		transform: translateY(-2px);
	}

	.option-card:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.option-card p {
		color: var(--gray);
	}

	@media (max-width: 768px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
