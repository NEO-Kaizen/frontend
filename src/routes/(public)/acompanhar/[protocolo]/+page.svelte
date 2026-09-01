<script lang="ts">
	import { page } from '$app/state';
	import { mockSolicitations } from '$lib/mocks/solicitations';
	import type { RequestDetail } from '$lib/types/solicitation';

	const protocol = page.params.protocolo;
	const solicitation: RequestDetail | undefined = mockSolicitations.find(
		(s) => s.protocol.toLowerCase() === protocol?.toLowerCase()
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

<svelte:head>
	<title>Detalhes da Solicitação {protocol} - NEO</title>
</svelte:head>

<main class="container">
	{#if solicitation}
		<div class="header-actions">
			<a href="/" class="btn-back">
				&larr; Voltar para busca
			</a>
		</div>

		<div class="card-detail">
			<div class="detail-header">
				<div>
					<span class="protocol-number">Protocolo #{solicitation.protocol}</span>
					<h1 class="demand-title">{solicitation.demandTitle}</h1>
				</div>
				<span class="status-tag">{solicitation.status}</span>
			</div>

			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Responsável Técnico</span>
					<span class="info-value">{solicitation.assigneeName || 'Não atribuído'}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Data de Abertura</span>
					<span class="info-value">{formatDate(solicitation.openedAt)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Previsão de Conclusão</span>
					<span class="info-value">{formatDate(solicitation.estimatedCompletion)}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Última Atualização</span>
					<span class="info-value">{formatDate(solicitation.lastUpdate)}</span>
				</div>
			</div>

			{#if solicitation.lastTechnicalMessage}
				<div class="section">
					<h2>Última Atualização Técnica</h2>
					<p class="description">{solicitation.lastTechnicalMessage}</p>
				</div>
			{/if}

			{#if solicitation.meeting}
				<div class="section">
					<h2>Reunião de Alinhamento</h2>
					<p class="description">Data: {formatDate(solicitation.meeting.scheduledFor)}</p>
					{#if solicitation.meeting.link}
						<a href={solicitation.meeting.link} target="_blank" rel="noopener noreferrer" class="btn-primary">
							Entrar na reunião
						</a>
					{:else}
						<button class="btn-primary disabled" disabled title="Link da reunião ainda não disponível">
							Entrar na reunião (Link indisponível)
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="not-found" role="alert">
			<div class="alert-box">
				<h2>Solicitação não encontrada</h2>
				<p>Não encontramos nenhuma solicitação cadastrada com o protocolo <strong>"{protocol}"</strong>.</p>
				<p class="hint">Verifique o número digitado e tente novamente.</p>
			</div>
			<div class="action-center">
				<a href="/" class="btn-primary"> Nova Consulta </a>
			</div>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--spacing-xl) var(--spacing-md);
	}

	.header-actions {
		margin-bottom: var(--spacing-md);
	}

	.btn-back {
		color: var(--primary-color);
		text-decoration: none;
		font-weight: 500;
		font-size: var(--font-size-sm);
	}

	.btn-back:hover {
		text-decoration: underline;
	}

	.card-detail {
		background: var(--white);
		border-radius: 12px;
		border: var(--border-default);
		padding: var(--spacing-xl);
		box-shadow: var(--shadow-sm);
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: var(--border-default);
		padding-bottom: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		gap: var(--spacing-md);
	}

	.protocol-number {
		font-size: var(--font-size-sm);
		color: #64748b;
		font-weight: 600;
	}

	.demand-title {
		font-size: var(--font-size-xl);
		color: var(--primary-color);
		margin-top: var(--spacing-xs);
	}

	.status-tag {
		background: var(--bg-light);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		text-transform: uppercase;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-md);
		background-color: #f8fafc;
		padding: var(--spacing-md);
		border-radius: 8px;
		margin-bottom: var(--spacing-lg);
	}

	.info-item {
		display: flex;
		flex-direction: column;
	}

	.info-label {
		font-size: 0.75rem;
		color: #64748b;
		text-transform: uppercase;
		font-weight: 600;
	}

	.info-value {
		font-size: var(--font-size-sm);
		color: var(--text-color);
		font-weight: 500;
		margin-top: 2px;
	}

	.section {
		margin-top: var(--spacing-xl);
	}

	.section h2 {
		font-size: var(--font-size-md);
		color: var(--text-color);
		margin-bottom: var(--spacing-sm);
	}

	.description {
		color: #334155;
		line-height: 1.6;
		font-size: var(--font-size-sm);
	}

	.not-found {
		margin-top: var(--spacing-xl);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.alert-box {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: var(--spacing-lg);
		color: #991b1b;
	}

	.alert-box h2 {
		font-size: var(--font-size-md);
		margin-bottom: var(--spacing-xs);
	}

	.hint {
		font-size: var(--font-size-sm);
		margin-top: var(--spacing-xs);
	}

	.action-center {
		display: flex;
		justify-content: center;
	}

	.btn-primary {
		display: inline-block;
		background-color: var(--primary-color);
		color: var(--white);
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}

	.btn-primary.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
