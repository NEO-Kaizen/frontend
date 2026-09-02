<script lang="ts">
	import { resolveRoute } from '$app/paths';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import { getRequestByProtocol } from '$lib/services/request.service';
	import type { RequestDetail, RequestStatus } from '$lib/types/request';
	import { formatDate, formatDateTime } from '$lib/utils/dates';

	const protocol = page.params.protocolo;

	let solicitation = $state<RequestDetail | null>(null);
	let isLoading = $state(true);

	$effect(() => {
		if (protocol) {
			isLoading = true;
			getRequestByProtocol(protocol).then((result) => {
				if (result.ok) {
					solicitation = result.data;
				} else {
					solicitation = null;
				}
				isLoading = false;
			});
		} else {
			isLoading = false;
		}
	});

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
	<title>Detalhes da Solicitação {protocol ?? ''} - NEO</title>
</svelte:head>

{#if isLoading}
	<div style="text-align: center; padding: 48px 0; color: #64748b;">
		<p>Carregando informações da solicitação...</p>
	</div>
{:else if solicitation}
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
						href={resolveRoute(solicitation.meeting.link as unknown as '/')}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-join"
					>
						<Icon iconName="link" iconSize="sm" />
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
	<NotFoundState
		title="Solicitação não encontrada"
		message={`Não encontramos nenhuma solicitação cadastrada com o protocolo "${protocol ?? ''}".`}
		hint="Verifique o número digitado e tente novamente."
	/>
{/if}

<style>
	.solicitation-card {
		background: #ffffff;
		border-radius: 8px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		word-break: break-word;
	}

	.card-header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
	}

	.badge-active {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		color: #1e40af;
		background: #dbeafe;
		padding: 4px 8px;
		border-radius: 4px;
		margin-bottom: 8px;
	}

	.left-badges h2 {
		margin: 4px 0;
		font-size: 1.25rem;
		line-height: 1.4;
		color: var(--primary-color, #0f172a);
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
		white-space: nowrap;
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
		gap: 16px;
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
		justify-content: center;
		gap: 6px;
		padding: 8px 16px;
		background: #16a34a;
		color: white;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		border: none;
		white-space: nowrap;
	}

	.btn-join.disabled {
		background: #9ca3af;
		opacity: 0.8;
		cursor: not-allowed;
	}

	.technical-message {
		background: #f8fafc;
		padding: 12px;
		border-left: 4px solid #0284c7;
		border-radius: 0 4px 4px 0;
		margin-top: 8px;
	}

	@media (max-width: 640px) {
		.solicitation-card {
			padding: 16px;
		}

		.card-header-top {
			flex-direction: column;
			align-items: flex-start;
		}

		.meeting-card {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-join {
			width: 100%;
		}

		.metadata-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
