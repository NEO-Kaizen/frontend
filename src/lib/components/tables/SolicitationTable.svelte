<!-- Componente global: usado em /acompanhar, /fila e /home -->
<script lang="ts">
	import foundImg from '$lib/assets/SolicitationIllustration.svg';
	import Pagination from './Pagination.svelte';
	import Button from '$lib/components/Button.svelte';
	import { invalidateAll } from '$app/navigation';
	import { formatShortDate, formatShortTime } from '$lib/utils/dates';
	import type { PaginatedResponse, RequestStatus, RequestSummary } from '$lib/types/request';
	import type { Result } from '$lib/types/result';
	import { resolve } from '$app/paths';

	const mapStatusToClass: Record<RequestStatus, string> = {
		'Aguardando triagem': 'status-blue',
		'Aguardando mapeamento': 'status-blue',
		'Em triagem': 'status-blue',
		'Em desenvolvimento': 'status-blue',
		'Direcionado para outra área': 'status-neutral',
		'Em análise de viabilidade': 'status-blue',
		'Em homologação': 'status-blue',
		'Em mapeamento': 'status-blue',
		'Não elegível': 'status-red',
		'Pendente de informações': 'status-yellow',
		'Solicitação enviada': 'status-neutral',
		'Mapeamento agendado': 'status-blue',
		Elegível: 'status-green',
		Concluído: 'status-green',
		Priorizado: 'status-yellow',
		Cancelado: 'status-red',
		Backlog: 'status-neutral'
	};

	// União literal estreita: evita o falso-positivo RouteId × resolve() documentado.
	type DetailRoute = '/(public)/acompanhar/[protocolo]' | '/(admin)/fila/[protocolo]';

	type Props = {
		page: number;
		result: Result<PaginatedResponse<RequestSummary>> | null;
		isFetching: boolean;
		detailRoute?: DetailRoute;
		emptyTitle?: string;
		emptyMessage?: string;
		onretry?: () => void;
		onpagechange: (page: number) => void;
	};

	let {
		page,
		result = null,
		isFetching = false,
		detailRoute = '/(public)/acompanhar/[protocolo]',
		emptyTitle = 'Nenhuma solicitação encontrada',
		emptyMessage,
		onretry,
		onpagechange
	}: Props = $props();

	const results = $derived(result?.ok ? result.data.data : []);
	const totalPages = $derived(result?.ok ? result.data.totalPages : 0);
	const totalItems = $derived(result?.ok ? result.data.total : 0);
	// Clampa a página pedida ao intervalo real, protegendo o rodapé de valores
	// como "Exibindo 491–14" quando a URL traz uma página fora do range.
	const currentPage = $derived(Math.min(Math.max(page, 1), Math.max(totalPages, 1)));
	const firstVisibleItem = $derived(
		result?.ok && results.length > 0 ? (currentPage - 1) * result.data.pageSize + 1 : 0
	);
	const lastVisibleItem = $derived(
		result?.ok && results.length > 0
			? Math.min(currentPage * result.data.pageSize, result.data.total)
			: 0
	);
</script>

<div class="table-container" class:is-loading={isFetching} aria-busy={isFetching}>
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>PROTOCOLO</th>
					<th>DATA</th>
					<th>PROCESSO</th>
					<th>PRIORIDADE</th>
					<th>STATUS</th>
					<th>RESPONSÁVEL</th>
					<th>SOLICITANTE</th>
				</tr>
			</thead>

			<tbody>
				{#if isFetching && results.length === 0}
					<tr>
						<td colspan="7">
							<div class="loading-state" role="status" aria-live="polite">
								<p>Carregando solicitações…</p>
							</div>
						</td>
					</tr>
				{:else if result === null}
					<tr>
						<td colspan="7">
							<div class="empty-state">
								<img
									class="empty-illustration"
									src={foundImg}
									alt="Nenhuma solicitação consultada"
								/>

								<h3>Nenhuma solicitação consultada</h3>
								<p>
									Preencha um ou ambos os campos acima e clique em "Consultar Protocolo" para
									visualizar os resultados.
								</p>
							</div>
						</td>
					</tr>
				{:else if !result.ok}
					<tr>
						<td colspan="7">
							<div class="error-state" role="alert">
								<p>{result.error.message}</p>
								<Button variant="outline" onclick={() => (onretry ? onretry() : invalidateAll())}>
									Tentar novamente
								</Button>
							</div>
						</td>
					</tr>
				{:else if results.length > 0}
					{#each results as request (request.protocol)}
						<tr>
							<td class="protocolo">
								<a
									href={resolve(detailRoute, {
										protocolo: request.protocol
									})}
								>
									#{request.protocol}
								</a>
							</td>

							<td class="data-col">
								{formatShortDate(request.createdAt)} <br />
								{formatShortTime(request.createdAt)}
							</td>

							<td class="processo">{request.processName}</td>

							<td>
								<span
									class="prioridade"
									class:critica={request.priority === 'Crítica'}
									class:alta={request.priority === 'Alta'}
									class:media={request.priority === 'Média'}
									class:baixa={request.priority === 'Baixa'}
								>
									{request.priority?.toUpperCase() ?? '-'}
								</span>
							</td>

							<td>
								<span class="status {mapStatusToClass[request.status] ?? 'status-neutral'}">
									<span class="status-dot"></span>
									{request.status}
								</span>
							</td>

							<td class="responsavel">{request.assignee ?? '-'}</td>
							<td class="solicitante">{request.requesterName}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="7">
							<div class="empty-state">
								<h3>{emptyTitle}</h3>
								{#if emptyMessage}
									<p>{emptyMessage}</p>
								{/if}
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
	<div class="table-footer">
		<div class="footer-info">
			{#if isFetching}
				<span class="table-loading" role="status" aria-live="polite">Atualizando…</span>
			{/if}
			<span class="pagination-info">
				Exibindo {firstVisibleItem}–{lastVisibleItem} de {totalItems} entradas
			</span>
		</div>
		<Pagination {currentPage} {totalPages} {onpagechange} />
	</div>
</div>

<style>
	.table-container {
		width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
		overflow: hidden;
	}

	.table-scroll {
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
		min-width: 1100px;
	}

	th {
		padding: var(--spacing-md) var(--spacing-lg);
		text-align: left;
		background: var(--background-color);
		color: var(--gray);
		font: var(--label);
		font-size: 12px;
		text-transform: uppercase;
		white-space: nowrap;
		border-bottom: var(--border-default);
	}

	td {
		padding: var(--spacing-lg);
		border-bottom: var(--border-default);
		color: var(--rich-black);
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.protocolo {
		color: var(--secondary-color);
		font-weight: 700;
	}

	.protocolo a {
		color: inherit;
	}

	.processo {
		font-weight: 700;
		max-width: 140px;
		white-space: normal;
		line-height: 1.3;
	}

	.prioridade {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;
	}

	.prioridade.critica {
		color: var(--status-red);
		background: var(--status-red-bg);
	}

	.prioridade.alta {
		color: var(--status-yellow);
		background: var(--status-yellow-bg);
	}

	.prioridade.media {
		color: var(--status-blue);
		background: var(--status-blue-bg);
	}

	.prioridade.baixa {
		color: var(--status-neutral);
		background: var(--status-neutral-bg);
	}

	.responsavel,
	.solicitante {
		font-weight: 600;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 600;
		white-space: normal;
		max-width: 130px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status.status-blue {
		color: var(--status-blue);
	}
	.status.status-blue .status-dot {
		background: var(--status-blue);
	}

	.status.status-green {
		color: var(--status-green);
	}
	.status.status-green .status-dot {
		background: var(--status-green);
	}

	.status.status-red {
		color: var(--status-red);
	}
	.status.status-red .status-dot {
		background: var(--status-red);
	}

	.status.status-yellow {
		color: var(--status-yellow);
	}
	.status.status-yellow .status-dot {
		background: var(--status-yellow);
	}

	.status.status-neutral {
		color: var(--status-neutral);
	}
	.status.status-neutral .status-dot {
		background: var(--status-neutral);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 64px 24px;
		text-align: center;
	}

	.empty-illustration {
		width: 120px;
		height: auto;
		margin-bottom: var(--spacing-lg);
		opacity: 0.9;
	}

	.empty-state h3 {
		margin: 0 0 var(--spacing-xs);
		font: var(--h3);
		color: var(--primary-color);
	}

	.empty-state p {
		margin: 0;
		max-width: 450px;
		font: var(--paragrafo);
		color: var(--gray);
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xl) 24px;
		text-align: center;
	}

	.loading-state p,
	.error-state p {
		margin: 0;
		font: var(--paragrafo);
		color: var(--gray);
	}

	.table-container.is-loading tbody {
		opacity: 0.55;
		transition: opacity 120ms ease;
	}

	.table-container.is-loading {
		cursor: progress;
	}

	.footer-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.table-loading {
		font: var(--label);
		color: var(--secondary-color);
	}

	.table-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--white);
		border-top: var(--border-default);
	}

	.pagination-info {
		font: var(--label);
		color: var(--gray);
	}

	.data-col {
		color: var(--gray);
		line-height: 1.4;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}
</style>
