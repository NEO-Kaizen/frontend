<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import SolicitationSpecs from './components/SolicitationSpecs.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const protocol = $derived(data.protocol);
	const error = $derived(data.error);

	let solicitation = $derived(data.solicitation);

	function handleTriageSuccess(updated: typeof solicitation) {
		solicitation = updated;

		// A Triagem possui endpoint próprio de leitura.
		// Após a persistência, revalidamos os dados do servidor.
		void invalidateAll();
	}

	function handlePrioritizationSuccess(updated: typeof solicitation) {
		// A Priorização atualiza imediatamente o estado recebido
		// pelo fluxo de persistência, sem reutilizar o callback
		// semanticamente exclusivo da Triagem.
		solicitation = updated;
	}
</script>

<svelte:head>
	<title>Especificação {protocol ?? ''} - {data.portalConfig.platformName}</title>
</svelte:head>

<div class="page-container">
	{#if error && error.status !== 404}
		{#if error.status === 401 || error.status === 403}
			<div class="error-state" role="alert">
				<p>Acesso negado. Você não tem permissão para visualizar esta solicitação.</p>
				<a href={resolve('/(public)/sem-autorizacao')} class="btn-retry">Voltar</a>
			</div>
		{:else}
			<div class="error-state" role="alert">
				<p>{error.message}</p>
				<button type="button" class="btn-retry" onclick={() => invalidateAll()}>
					Tentar novamente
				</button>
			</div>
		{/if}
	{:else if solicitation}
		<SolicitationSpecs
			{solicitation}
			internalNotes={data.internalNotes}
			internalNotesError={data.internalNotesError}
			onTriageSuccess={handleTriageSuccess}
			onPrioritizationSuccess={handlePrioritizationSuccess}
		/>
	{:else if error && error.status === 404}
		<NotFoundState
			title="Solicitação não encontrada"
			message={`Não encontramos nenhuma solicitação cadastrada com o protocolo "${protocol ?? ''}".`}
			hint="Verifique o número digitado e tente novamente."
		/>
	{:else}
		<div class="loading-state" aria-busy="true" aria-label="Carregando solicitação">
			<div class="skeleton header-skeleton"></div>
			<div class="skeleton card-skeleton"></div>
			<div class="skeleton card-skeleton"></div>
			<div class="skeleton card-skeleton"></div>
		</div>
	{/if}
</div>

<style>
	.page-container {
		width: 100%;
		max-width: var(--largura-maxima-conteudo);
		margin: 0 auto;
		padding: 0px var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.error-state {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		text-align: center;
		box-shadow: var(--regular-shadow);
		color: var(--status-red);
	}

	.error-state p {
		margin-bottom: var(--spacing-md);
		font: var(--paragrafo);
		color: var(--status-red);
	}

	.btn-retry {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		background: var(--primary-color);
		color: var(--on-primary);
		border: none;
		border-radius: var(--radius-sm);
		font: var(--button);
		cursor: pointer;
		transition: var(--transition-default);
		text-decoration: none;
	}

	.btn-retry:hover {
		background: var(--secondary-color);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.skeleton {
		background: linear-gradient(
			90deg,
			var(--border-color) 25%,
			var(--surface) 50%,
			var(--border-color) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.header-skeleton {
		height: 80px;
	}

	.card-skeleton {
		height: 120px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
			background: var(--white-gray);
		}
	}
</style>
