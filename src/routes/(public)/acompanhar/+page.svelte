<script lang="ts">
	import { page } from '$app/stores';
	import { resolveRoute } from '$app/paths';
	import ProtocolSearchCard from '$lib/components/forms/ProtocolSearchCard.svelte';
	import { mockSolicitations } from '$lib/mocks/solicitations';

	let searchEmail = $derived($page.url.searchParams.get('email') || '');

	let userSolicitations = $derived(
		searchEmail
			? mockSolicitations.filter(
					(s) => s.applicantEmail.toLowerCase() === searchEmail.trim().toLowerCase()
				)
			: []
	);

	function formatDate(isoString: string | null) {
		if (!isoString) return 'N/A';
		const date = new Date(isoString);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<div class="page-viewport">
	<ProtocolSearchCard />

	{#if searchEmail}
		<div class="results-container">
			<div class="results-header">
				<h2>Solicitações encontradas para <span>{searchEmail}</span></h2>
				<p>Listando {userSolicitations.length} solicitação(ões) associada(s) ao seu e-mail.</p>
			</div>

			{#if userSolicitations.length > 0}
				<div class="cards-list">
					{#each userSolicitations as item (item.protocol)}
						<div class="solicitation-item-card">
							<div class="item-header">
								<div>
									<span class="protocol-tag">#{item.protocol}</span>
									<h3>{item.demandTitle}</h3>
								</div>
								<span class="status-pill">{item.status}</span>
							</div>

							<div class="item-details">
								<div>
									<span class="label">RESPONSÁVEL</span>
									<p>{item.assigneeName || 'Aguardando atribuição'}</p>
								</div>
								<div>
									<span class="label">PREVISÃO DE CONCLUSÃO</span>
									<p>{formatDate(item.estimatedCompletion)}</p>
								</div>
							</div>

							<div class="item-footer">
								<a
									href={resolveRoute('/acompanhar/[protocolo]', { protocolo: item.protocol })}
									class="btn-view-details"
								>
									Ver detalhes do protocolo →
								</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>Nenhuma solicitação cadastrada para o e-mail informado.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page-viewport {
		max-width: 1100px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.results-header h2 {
		font-size: 1.25rem;
		color: #0f172a;
		margin: 0 0 4px 0;
	}

	.results-header span {
		color: #002068;
	}

	.results-header p {
		color: #64748b;
		margin: 0 0 24px 0;
	}

	.cards-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.solicitation-item-card {
		background: #ffffff;
		border-radius: 12px;
		padding: 24px;
		border: 1px solid #e2e8f0;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
	}

	.protocol-tag {
		font-size: 0.8rem;
		font-weight: 700;
		color: #64748b;
	}

	.item-header h3 {
		font-size: 1.1rem;
		color: #0f172a;
		margin: 4px 0 0 0;
	}

	.status-pill {
		background-color: #f1f5f9;
		color: #334155;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 6px 12px;
		border-radius: 6px;
	}

	.item-details {
		display: flex;
		gap: 32px;
		margin-bottom: 16px;
	}

	.label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #94a3b8;
		display: block;
	}

	.item-details p {
		margin: 2px 0 0 0;
		font-size: 0.9rem;
		color: #334155;
		font-weight: 600;
	}

	.item-footer {
		border-top: 1px solid #f1f5f9;
		padding-top: 12px;
		text-align: right;
	}

	.btn-view-details {
		color: #0052cc;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.empty-state {
		background: #ffffff;
		padding: 32px;
		border-radius: 12px;
		text-align: center;
		color: #64748b;
		border: 1px solid #e2e8f0;
	}
</style>
