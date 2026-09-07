<!-- src/lib/components/TabelaSolicitacoes.svelte -->
<script lang="ts">
	import foundImg from '$lib/assets/SolicitationIllustration.svg';
	import Pagination from '$lib/components/Pagination.svelte';
	import { mockRequests } from '$lib/mocks/requests';
	import type { RequestStatus } from '$lib/types/request';
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

	let { email = '' } = $props();

	const solicitacoes = mockRequests;

	let solicitacoesFiltradas = $derived(
		solicitacoes.filter((item) => {
			if (email) {
				return item.corporateEmail.toLowerCase() === email.toLowerCase();
			}

			return false;
		})
	);

	let paginaAtual = $state(1);
	let ultimoEmail = $state('');

	$effect(() => {
		if (email !== ultimoEmail) {
			ultimoEmail = email;
			paginaAtual = 1;
		}
	});

	const itensPorPagina = 4;

	let totalPaginas = $derived(Math.ceil(solicitacoesFiltradas.length / itensPorPagina));

	let solicitacoesPagina = $derived(
		solicitacoesFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina)
	);

	let inicioExibicao = $derived(
		solicitacoesFiltradas.length === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1
	);

	let fimExibicao = $derived(Math.min(paginaAtual * itensPorPagina, solicitacoesFiltradas.length));

	function formatarDataHora(dataString: string) {
		const date = new Date(dataString);

		const data = date.toLocaleDateString('pt-BR');

		const hora = date.toLocaleTimeString('pt-BR', {
			hour: '2-digit',
			minute: '2-digit'
		});

		return { data, hora };
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
							{#if solicitacoesFiltradas.length > 0}
								{#each solicitacoesPagina as solicitacao (solicitacao.protocol)}
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
											{formatarDataHora(solicitacao.createdAt).data} <br />
											{formatarDataHora(solicitacao.createdAt).hora}
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
										<td class="responsavel">{solicitacao.corporateEmail ?? '-'}</td>
									</tr>
								{/each}
							{:else if email}
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
							{:else}
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
							{/if}
						</tbody>
					</table>
				</div>
				<div class="table-footer">
					<span class="pagination-info">
						{#if solicitacoesFiltradas.length === 0}
							Exibindo 0 de 0 entradas
						{:else}
							Exibindo {inicioExibicao}–{fimExibicao} de {solicitacoesFiltradas.length} entradas
						{/if}
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

	.pagination-info {
		font: var(--label);
		color: var(--gray);
		font-weight: 400;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}
</style>
