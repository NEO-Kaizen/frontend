<!-- src/routes/(public)/acompanhar/components/SolicitationTable.svelte -->
<script lang="ts">
	import foundImg from '$lib/assets/SolicitationIllustration.svg';
	import Pagination from '$lib/components/Pagination.svelte';
	import { listRequests } from '$lib/services/request.service';
	import { formatShortDate, formatShortTime } from '$lib/utils/dates';
	import type { PaginatedResponse, RequestStatus, RequestSummary } from '$lib/types/request';
	import { resolve } from '$app/paths';

	const mapStatusToClass: Record<RequestStatus, string> = {
		'Aguardando triagem': 'status-blue',
		'Aguardando mapeamento': 'status-blue',
		'Em triagem': 'status-blue',
		'Em desenvolvimento': 'status-blue',
		'Direcionado para outra área': 'status-gray',
		'Em análise de viabilidade': 'status-blue',
		'Em homologação': 'status-blue',
		'Em mapeamento': 'status-blue',
		'Não elegível': 'status-red',
		'Pendente de informações': 'status-yellow',
		'Solicitação enviada': 'status-gray',
		'Mapeamento agendado': 'status-blue',
		Elegível: 'status-green',
		Concluído: 'status-green',
		Priorizado: 'status-yellow',
		Cancelado: 'status-red',
		Backlog: 'status-gray'
	};

	const PAGE_SIZE = 4;

	let { email = '' } = $props();

	let paginaAtual = $state(1);
	let isFetching = $state(false);
	let fetchError = $state<{ message: string } | null>(null);
	let pageData = $state<PaginatedResponse<RequestSummary> | null>(null);
	let retryTick = $state(0);

	// Não reativo: invalida respostas de buscas atrasadas (ordem de chegada).
	let buscaAtiva = 0;

	const resultados = $derived(pageData?.data ?? []);
	const totalPaginas = $derived(pageData?.totalPages ?? 0);
	const totalResultados = $derived(pageData?.total ?? 0);
	const inicioExibicao = $derived(
		pageData && totalResultados > 0 ? (pageData.page - 1) * pageData.pageSize + 1 : 0
	);
	const fimExibicao = $derived(
		pageData ? Math.min(pageData.page * pageData.pageSize, totalResultados) : 0
	);

	async function carregarResultados(emailBusca: string, paginaBusca: number, busca: number) {
		isFetching = true;
		fetchError = null;

		const result = await listRequests({
			email: emailBusca,
			page: paginaBusca,
			pageSize: PAGE_SIZE
		});

		if (busca !== buscaAtiva) return;

		isFetching = false;

		if (!result.ok) {
			fetchError = result.error;
			return;
		}

		// E-mail trocado com página antiga em memória: volta para a primeira página.
		if (paginaBusca > result.data.totalPages) {
			paginaAtual = 1;
			return;
		}

		pageData = result.data;
	}

	$effect(() => {
		if (!email) {
			// Sem consulta: invalida buscas em voo e mantém o estado inicial.
			buscaAtiva += 1;
			return;
		}

		const busca = ++buscaAtiva;
		const emailBusca = email;
		void retryTick;
		const paginaBusca = paginaAtual;

		carregarResultados(emailBusca, paginaBusca, busca);
	});

	function tentarNovamente() {
		retryTick += 1;
	}
</script>

<main class="content-container">
	<section class="acompanhar">
		<section class="solicitacoes">
			<div class="table-container">
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
							{#if !email}
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
							{:else if isFetching}
								<tr>
									<td colspan="7">
										<div class="loading-state" role="status" aria-live="polite">
											<p>Carregando solicitações…</p>
										</div>
									</td>
								</tr>
							{:else if fetchError}
								<tr>
									<td colspan="7">
										<div class="error-state" role="alert">
											<p>{fetchError.message}</p>
											<button type="button" class="btn-retry" onclick={tentarNovamente}>
												Tentar novamente
											</button>
										</div>
									</td>
								</tr>
							{:else if resultados.length > 0}
								{#each resultados as solicitacao (solicitacao.protocol)}
									<tr>
										<td class="protocolo">
											<a
												href={resolve('/(public)/acompanhar/[protocolo]', {
													protocolo: solicitacao.protocol
												})}
											>
												#{solicitacao.protocol}
											</a>
										</td>

										<td class="data-col">
											{formatShortDate(solicitacao.createdAt)} <br />
											{formatShortTime(solicitacao.createdAt)}
										</td>

										<td class="processo">{solicitacao.processName}</td>

										<td>
											<span
												class="prioridade"
												class:critica={solicitacao.priority === 'Crítica'}
												class:alta={solicitacao.priority === 'Alta'}
												class:media={solicitacao.priority === 'Média'}
												class:baixa={solicitacao.priority === 'Baixa'}
											>
												{solicitacao.priority?.toUpperCase() ?? '-'}
											</span>
										</td>

										<td>
											<span class="status {mapStatusToClass[solicitacao.status] ?? 'status-gray'}">
												<span class="status-dot"></span>
												{solicitacao.status}
											</span>
										</td>

										<td class="solicitante">{solicitacao.requesterName}</td>
										<td class="responsavel">{solicitacao.assignee ?? '-'}</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="7">
										<div class="empty-state">
											<h3>Nenhuma solicitação encontrada</h3>
											<p>
												Não encontramos solicitações para o e-mail <strong>{email}</strong>.
											</p>
										</div>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
				<div class="table-footer">
					<span class="pagination-info">
						Exibindo {inicioExibicao}–{fimExibicao} de {totalResultados} entradas
					</span>
					<Pagination bind:paginaAtual {totalPaginas} />
				</div>
			</div>
		</section>
	</section>
</main>

<style>
	.acompanhar {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		width: 100%;
	}

	.solicitacoes {
		width: 100%;
	}

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
		color: var(--gray);
		background: var(--white-gray);
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

	.status.status-gray {
		color: var(--gray);
	}
	.status.status-gray .status-dot {
		background: var(--gray);
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

	.btn-retry {
		padding: var(--spacing-xs) var(--spacing-md);
		font: var(--paragrafo);
		font-weight: 600;
		color: var(--secondary-color);
		background: none;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.btn-retry:hover {
		background: var(--background-color);
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
