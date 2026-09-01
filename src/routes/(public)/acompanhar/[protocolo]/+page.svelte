<script lang="ts">
	import { page } from '$app/state';
	import { mockSolicitations } from '$lib/mocks/solicitations';
	import type { RequestDetail } from '$lib/types/solicitation';
	import { formatDate, formatDateTime } from '$lib/utils/dates';

	const protocol = page.params.protocolo;
	const solicitation: RequestDetail | undefined = mockSolicitations.find(
		(s) => s.protocol.toLowerCase() === protocol?.toLowerCase()
	);
</script>

<svelte:head>
	<title>Detalhes da Solicitação {protocol} - NEO</title>
</svelte:head>

{#if solicitation}
	<div class="solicitation-card">
		<div class="card-header-top">
			<div class="left-badges">
				<span class="badge-active">SOLICITAÇÃO ATIVA</span>
				<h2>{solicitation.demandTitle}</h2>
				<span class="protocol-code">#{solicitation.protocol}</span>
			</div>
			<div class="right-status">
				<span class="status-pill">{solicitation.status}</span>
			</div>
		</div>

		<div class="metadata-grid">
			<div class="meta-item">
				<span class="meta-label">Responsável Técnico</span>
				<span class="meta-value">{solicitation.assigneeName ?? 'Não atribuído'}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Data de Abertura</span>
				<span class="meta-value">{formatDate(solicitation.openedAt)}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Previsão de Conclusão</span>
				<span class="meta-value">{formatDate(solicitation.estimatedCompletion)}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Última Atualização</span>
				<span class="meta-value">{formatDateTime(solicitation.lastUpdate)}</span>
			</div>
		</div>

		{#if solicitation.meeting}
			<div class="meeting-card">
				<div class="meeting-info">
					<h3>Reunião de Alinhamento</h3>
					<p>{formatDateTime(solicitation.meeting.scheduledFor)}</p>
				</div>
				{#if solicitation.meeting.link}
					<a
						href={solicitation.meeting.link}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-join"
					>
						Entrar na reunião
					</a>
				{:else}
					<button class="btn-join disabled" disabled title="Link da reunião ainda não disponibilizado">
						Entrar na reunião
					</button>
				{/if}
			</div>
		{/if}

		{#if solicitation.lastTechnicalMessage}
			<div class="history-section">
				<h3>Última Mensagem do Responsável</h3>
				<p class="technical-message">{solicitation.lastTechnicalMessage}</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="not-found-card" role="alert">
		<h2>Solicitação não encontrada</h2>
		<p>
			Não encontramos nenhuma solicitação cadastrada com o protocolo <strong>"{protocol}"</strong>.
		</p>
		<p class="hint">Verifique o número digitado e tente novamente.</p>
	</div>
{/if}

<style>
	.solicitation-card,
	.not-found-card {
		background: #ffffff;
		border-radius: 8px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.card-header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20px;
	}

	.badge-active {
		font-size: 0.75rem;
		font-weight: 700;
		color: #1e40af;
		background: #dbeafe;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.protocol-code {
		font-weight: 600;
		color: #64748b;
	}

	.status-pill {
		background: #f1f5f9;
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.metadata-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
		padding: 16px;
		background: #f8fafc;
		border-radius: 6px;
	}

	.meta-label {
		display: block;
		font-size: 0.75rem;
		color: #64748b;
		margin-bottom: 4px;
	}

	.meta-value {
		font-weight: 600;
		color: #0f172a;
	}

	.meeting-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 6px;
		margin-bottom: 20px;
	}

	.btn-join {
		padding: 8px 16px;
		background: #16a34a;
		color: white;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		border: none;
	}

	.btn-join.disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.technical-message {
		background: #f8fafc;
		padding: 12px;
		border-left: 4px solid #0284c7;
		border-radius: 0 4px 4px 0;
	}

	.hint {
		color: #64748b;
		font-size: 0.875rem;
	}
</style>
