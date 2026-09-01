<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { mockSolicitations } from '$lib/mocks/solicitations';
	import type { RequestDetail, RequestStatus } from '$lib/types/solicitation';
	import { formatDate, formatDateTime } from '$lib/utils/dates';

	const protocol = page.params.protocolo;
	const solicitation: RequestDetail | undefined = mockSolicitations.find(
		(s) => s.protocol.toLowerCase() === protocol?.toLowerCase()
	);

	function getStatusTheme(status: RequestStatus): { bg: string; color: string; border: string } {
		switch (status) {
			case 'Concluído':
			case 'Elegível':
				return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
			case 'Pendente de informações':
			case 'Aguardando triagem':
			case 'Aguardando mapeamento':
				return { bg: '#fefce8', color: '#854d0e', border: '#fef08a' };
			case 'Cancelado':
			case 'Não elegível':
				return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
			default:
				return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
		}
	}
</script>

<svelte:head>
	<title>Detalhes da Solicitação {protocol} - NEO</title>
</svelte:head>

{#if solicitation}
	{@const statusStyle = getStatusTheme(solicitation.status)}
	<div class="solicitation-card">
		<div class="card-header-top">
			<div class="left-badges">
				<span class="badge-active">SOLICITAÇÃO ATIVA</span>
				<h2>{solicitation.demandTitle}</h2>
				<span class="protocol-code">#{solicitation.protocol}</span>
			</div>
			<div class="right-status">
				<span
					class="status-pill"
					style:background-color={statusStyle.bg}
					style:color={statusStyle.color}
					style:border={`1px solid ${statusStyle.border}`}
				>
					{solicitation.status}
				</span>
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
					<div class="title-with-icon">
						<Icon iconName="calendarCheck" iconSize="md" />
						<h3>Reunião de Alinhamento</h3>
					</div>
					<p>{formatDateTime(solicitation.meeting.scheduledFor)}</p>
				</div>
				{#if solicitation.meeting.link}
					<a
						href={solicitation.meeting.link}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-join"
					>
						<Icon iconName="link" iconSize="sm" />
						<span>Entrar na reunião</span>
					</a>
				{:else}
					<button class="btn-join disabled" disabled title="Link da reunião ainda não disponibilizado">
						<Icon iconName="link" iconSize="sm" />
						<span>Entrar na reunião</span>
					</button>
				{/if}
			</div>
		{/if}

		{#if solicitation.lastTechnicalMessage}
			<div class="history-section">
				<div class="title-with-icon">
					<Icon iconName="history" iconSize="md" />
					<h3>Última Mensagem do Responsável</h3>
				</div>
				<p class="technical-message">{solicitation.lastTechnicalMessage}</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="not-found-card" role="alert">
		<Icon iconName="info" iconSize="xl" />
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

	.not-found-card {
		text-align: center;
		padding: 48px 24px;
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
		padding: 6px 12px;
		border-radius: 16px;
		font-size: 0.875rem;
		font-weight: 600;
		display: inline-block;
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

	.title-with-icon {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.title-with-icon h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.btn-join {
		display: inline-flex;
		align-items: center;
		gap: 6px;
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
		margin-top: 8px;
	}

	.hint {
		color: #64748b;
		font-size: 0.875rem;
	}
</style>
