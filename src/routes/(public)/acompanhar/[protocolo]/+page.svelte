<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import type { RequestStatus } from '$lib/types/request';
	import { formatDate, formatDateTime } from '$lib/utils/dates';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const protocol = $derived(data.protocol);
	const solicitation = $derived(data.solicitation);
	const error = $derived(data.error);

	const TERMINAL_STATUSES: RequestStatus[] = ['Concluído', 'Cancelado', 'Não elegível'];

	const badgeLabel = $derived(
		solicitation && TERMINAL_STATUSES.includes(solicitation.status)
			? 'SOLICITAÇÃO ENCERRADA'
			: 'SOLICITAÇÃO ATIVA'
	);

	function getStatusTheme(status: RequestStatus): { bg: string; color: string; border: string } {
		switch (status) {
			case 'Concluído':
			case 'Elegível':
				return {
					bg: 'var(--status-green-bg)',
					color: 'var(--status-green)',
					border: 'var(--status-green)'
				};
			case 'Pendente de informações':
			case 'Aguardando triagem':
			case 'Aguardando mapeamento':
				return {
					bg: 'var(--status-yellow-bg)',
					color: 'var(--status-yellow)',
					border: 'var(--status-yellow)'
				};
			case 'Cancelado':
			case 'Não elegível':
				return {
					bg: 'var(--status-red-bg)',
					color: 'var(--status-red)',
					border: 'var(--status-red)'
				};
			case 'Solicitação enviada':
			case 'Backlog':
			case 'Direcionado para outra área':
				return {
					bg: 'var(--status-neutral-bg)',
					color: 'var(--status-neutral)',
					border: 'var(--status-neutral)'
				};
			default:
				return {
					bg: 'var(--status-blue-bg)',
					color: 'var(--status-blue)',
					border: 'var(--status-blue)'
				};
		}
	}
</script>

<svelte:head>
	<title>Detalhes da Solicitação {protocol ?? ''} - {data.portalConfig.platformName}</title>
</svelte:head>

{#if error && error.status !== 404}
	<div class="error-state" role="alert">
		<p>{error.message}</p>
		<button type="button" class="btn-retry" onclick={() => invalidateAll()}>
			Tentar novamente
		</button>
	</div>
{:else if solicitation}
	{@const statusStyle = getStatusTheme(solicitation.status)}
	<div class="solicitation-card">
		<!-- Cabeçalho -->
		<div class="card-header-top">
			<div class="left-badges">
				<span class="badge-active">{badgeLabel}</span>
				<h1>{solicitation.demandTitle}</h1>
				<span class="protocol-code">{solicitation.protocol}</span>
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

		<!-- Linha divisória -->
		<hr class="divider" />

		<!-- Grade de Metadados (4 colunas lado a lado) -->
		<div class="metadata-row">
			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="manageUsers" iconSize="sm" />
					<span class="meta-label">RESPONSÁVEL TÉCNICO</span>
				</div>
				<span class="meta-value">{solicitation.assigneeName ?? 'Não atribuído'}</span>
			</div>

			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="calendarCheck" iconSize="sm" />
					<span class="meta-label">DATA DE ABERTURA</span>
				</div>
				<span class="meta-value">{formatDate(solicitation.openedAt)}</span>
			</div>

			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="calendarCheck" iconSize="sm" />
					<span class="meta-label">PREVISÃO DE CONCLUSÃO</span>
				</div>
				<span class="meta-value">{formatDate(solicitation.estimatedCompletion)}</span>
			</div>

			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="history" iconSize="sm" />
					<span class="meta-label">ÚLTIMA ATUALIZAÇÃO</span>
				</div>
				<span class="meta-value">{formatDateTime(solicitation.lastUpdate)}</span>
			</div>
		</div>

		<!-- Card de Reunião de Alinhamento -->
		{#if solicitation.meeting}
			<div class="meeting-card">
				<div class="meeting-left">
					<div class="icon-square">
						<Icon iconName="calendarCheck" iconSize="md" />
					</div>
					<div class="meeting-details">
						<span class="meeting-label">REUNIÃO DE ALINHAMENTO</span>
						<span class="meeting-time">{formatDateTime(solicitation.meeting.scheduledFor)}</span>
					</div>
				</div>
				{#if solicitation.meeting.link}
					<a
						href={solicitation.meeting.link}
						target="_blank"
						rel="external noopener noreferrer"
						class="btn-join"
					>
						<Icon iconName="arrowForward" iconSize="sm" />
						<span>Entrar na reunião</span>
					</a>
				{:else}
					<button
						class="btn-join disabled"
						disabled
						title="O link para esta reunião ainda não foi disponibilizado"
					>
						<Icon iconName="block" iconSize="sm" />
						<span>Link indisponível</span>
						<span class="sr-only">: o link será disponibilizado após o agendamento da reunião</span>
					</button>
				{/if}
			</div>
		{/if}

		<!-- Seção Última Mensagem do Responsável -->
		{#if solicitation.lastTechnicalMessage}
			<div class="history-section">
				<h2>Última mensagem do responsável técnico</h2>
				<div class="speech-bubble">
					<p>{solicitation.lastTechnicalMessage}</p>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<NotFoundState
		title="Solicitação não encontrada"
		message={`Não encontramos nenhuma solicitação cadastrada com o protocolo "${protocol ?? ''}".`}
		hint="Verifique o número digitado e tente novamente."
	/>
{/if}

<style>
	.error-state {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		text-align: center;
		box-shadow: var(--regular-shadow);
		margin-top: var(--spacing-lg);
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
	}

	.btn-retry:hover {
		background: var(--secondary-color);
	}

	.solicitation-card {
		background: var(--white);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		box-shadow: var(--regular-shadow);
		border: var(--border-default);
		word-break: break-word;
	}

	.card-header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-md);
	}

	.badge-active {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		color: var(--secondary-color);
		background: var(--tint);
		padding: 3px 10px;
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
		letter-spacing: 0.03em;
		font-family: var(--font-inter);
	}

	.left-badges h1 {
		margin: 4px 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--primary-color);
		line-height: 1.3;
		font-family: var(--font-montserrat);
	}

	.protocol-code {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray);
		font-family: var(--font-inter);
	}

	.status-pill {
		padding: 6px 14px;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 600;
		display: inline-block;
		white-space: nowrap;
		font-family: var(--font-inter);
	}

	.divider {
		border: none;
		border-top: var(--border-default);
		margin: var(--spacing-lg) 0;
	}

	.metadata-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.meta-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
		color: var(--gray);
	}

	.meta-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--gray);
		letter-spacing: 0.03em;
		font-family: var(--font-inter);
	}

	.meta-value {
		display: block;
		font-weight: 700;
		font-size: 14px;
		color: var(--black);
		line-height: 1.3;
		font-family: var(--font-inter);
	}

	.meeting-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		margin-bottom: var(--spacing-lg);
	}

	.meeting-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.icon-square {
		width: 40px;
		height: 40px;
		background: var(--secondary-color);
		color: var(--on-primary);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.meeting-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meeting-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--gray);
		letter-spacing: 0.03em;
		font-family: var(--font-inter);
	}

	.meeting-time {
		font-size: 15px;
		font-weight: 700;
		color: var(--black);
		font-family: var(--font-inter);
	}

	.btn-join {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 18px;
		background: var(--secondary-color);
		color: var(--on-primary);
		border-radius: var(--radius-sm);
		text-decoration: none;
		font-weight: 600;
		font-size: 14px;
		border: none;
		white-space: nowrap;
		font-family: var(--font-inter);
		cursor: pointer;
	}

	.btn-join.disabled {
		background: var(--gray);
		opacity: 0.6;
		cursor: not-allowed;
	}

	.history-section h2 {
		font-size: 14px;
		font-weight: 700;
		color: var(--black);
		margin: 0 0 10px 0;
		font-family: var(--font-montserrat);
	}

	.speech-bubble {
		position: relative;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-md);
	}

	.speech-bubble p {
		margin: 0;
		font-style: italic;
		color: var(--black);
		font-size: 14px;
		font-family: var(--font-inter);
	}

	@media (max-width: 768px) {
		.metadata-row {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.solicitation-card {
			padding: var(--spacing-md);
		}

		.card-header-top {
			flex-direction: column;
		}

		.metadata-row {
			grid-template-columns: 1fr;
		}

		.meeting-card {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-join {
			width: 100%;
		}
	}
</style>
