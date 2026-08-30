<script lang="ts">
	import ProtocolSearchCard from './components/ProtocolSearchCard.svelte';

	interface Solicitacao {
		protocolo: string;
		data: string;
		horario: string;
		processo: string;
		prioridade: string;
		status: string;
		responsavel: string;
		solicitante: string;
	}

	let resultados = $state<Solicitacao[]>([]);
	let paginaAtual = $state(1);

	const solicitacoes: Solicitacao[] = [
		{
			protocolo: '#NEO-2026-08-9842',
			data: '14/10/2023',
			horario: '09:42',
			processo: 'Reembolso Corporativo',
			prioridade: 'Crítica',
			status: 'Em Triagem',
			responsavel: 'Nenhum',
			solicitante: 'pessoal@email.com'
		},
		{
			protocolo: '#NEO-2026-08-9842',
			data: '14/10/2023',
			horario: '11:30',
			processo: 'Férias 2024',
			prioridade: 'Média',
			status: 'Processado',
			responsavel: 'Nenhum',
			solicitante: 'pessoal@email.com'
		},
		{
			protocolo: '#NEO-2026-08-9842',
			data: '14/10/2023',
			horario: '11:30',
			processo: 'Férias 2024',
			prioridade: 'Média',
			status: 'Processado',
			responsavel: 'Nenhum',
			solicitante: 'pessoal@email.com'
		},
		{
			protocolo: '#NEO-2026-08-9842',
			data: '14/10/2023',
			horario: '12:05',
			processo: 'Troca de Hardware',
			prioridade: 'Baixa',
			status: 'Cancelado',
			responsavel: 'Nenhum',
			solicitante: 'alexandre@neo.com'
		},
		{
			protocolo: '#NEO-2026-08-9842',
			data: '14/10/2023',
			horario: '13:20',
			processo: 'Aditivo Contratual',
			prioridade: 'Crítica',
			status: 'Em Análise',
			responsavel: 'Nenhum',
			solicitante: 'marcotti@neo.com'
		}
	];

	function pesquisar(protocolo: string, email: string) {
		resultados = solicitacoes.filter((solicitacao) => {
			const protocoloEncontrado =
				!protocolo ||
				solicitacao.protocolo
					.toLowerCase()
					.includes(protocolo.trim().toLowerCase());

			const emailEncontrado =
				!email ||
				solicitacao.solicitante
					.toLowerCase()
					.includes(email.trim().toLowerCase());

			return protocoloEncontrado && emailEncontrado;
		});

		paginaAtual = 1;
	}

	const itensPorPagina = 4;

	let totalPaginas = $derived(
		Math.ceil(resultados.length / itensPorPagina)
	);

	let inicio = $derived(
		(paginaAtual - 1) * itensPorPagina
	);

	let fim = $derived(
		inicio + itensPorPagina
	);

	let solicitacoesPagina = $derived(
		resultados.slice(inicio, fim)
	);

	function paginaAnterior() {
		if (paginaAtual > 1) {
			paginaAtual--;
		}
	}

	function proximaPagina() {
		if (paginaAtual < totalPaginas) {
			paginaAtual++;
		}
	}
</script>

<main class="content-container">
	<section class="acompanhar">
		<div class="titulo">
			<h2>Acompanhar Solicitações</h2>
			<p>Consulte em tempo real os status da sua demanda institucional.</p>
		</div>

		<ProtocolSearchCard onSearch={pesquisar} />

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
							{#each solicitacoesPagina as solicitacao}
								<tr>
									<td>
										<a class="protocolo" href="/">
											{solicitacao.protocolo}
										</a>
									</td>

									<td>
										<div>{solicitacao.data}</div>
										<div>{solicitacao.horario}</div>
									</td>

									<td class="processo">
										{solicitacao.processo}
									</td>

									<td>
										<span
											class="prioridade"
											class:critica={solicitacao.prioridade === 'Crítica'}
											class:media={solicitacao.prioridade === 'Média'}
											class:baixa={solicitacao.prioridade === 'Baixa'}
										>
											{solicitacao.prioridade}
										</span>
									</td>

									<td>
										<span
											class="status"
											class:triagem={solicitacao.status === 'Em Triagem'}
											class:processado={solicitacao.status === 'Processado'}
											class:cancelado={solicitacao.status === 'Cancelado'}
											class:analise={solicitacao.status === 'Em Análise'}
										>
											<span class="status-dot"></span>
											{solicitacao.status}
										</span>
									</td>

									<td class="responsavel">
										{solicitacao.responsavel}
									</td>

									<td class="solicitante">
										{solicitacao.solicitante}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>

					<div class="table-footer">
						<p>
							Mostrando {resultados.length} de
							{resultados.length} solicitações
						</p>

						<div class="pagination">
							<button
								type="button"
								onclick={paginaAnterior}
								disabled={paginaAtual === 1}
							>
								‹
							</button>

							{#each Array(totalPaginas) as _, index}
								<button
									type="button"
									class:active={paginaAtual === index + 1}
									onclick={() => (paginaAtual = index + 1)}
								>
									{index + 1}
								</button>
							{/each}

							<button
								type="button"
								onclick={proximaPagina}
								disabled={paginaAtual === totalPaginas}
							>
								›
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	</section>
</main>

<style>
	.acompanhar {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
	}

	.titulo {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.titulo h2 {
		color: var(--primary-color);
	}

	.titulo p {
		color: var(--black);
	}

	
	.solicitacoes {
		width: 100%;
	}

	.table-container {
		width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	.table-scroll {
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		min-width: 1000px;
		border-collapse: collapse;
	}

	thead {
		background: var(--background-color);
	}

	th {
		padding: var(--spacing-md);
		text-align: left;
		font: var(--label);
		color: var(--black);
	}

	td {
		padding: var(--spacing-lg) var(--spacing-md);
		border-top: var(--border-default);
		font: var(--paragrafo);
		color: var(--black);
		vertical-align: middle;
	}

	.protocolo {
		color: var(--secondary-color);
		text-decoration: none;
	}

	.processo {
		width: 160px;
		max-width: 160px;
		font-weight: 600;
		color: var(--rich-black);
	}
	.responsavel,
	.solicitante {
		color: var(--rich-black);
		font-weight: 600;
	}
	.prioridade {
		font: var(--label);
		text-transform: uppercase;
	}
	.critica,
	.media {
		display: inline-block;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
	}

	.critica {
		color: var(--status-red);
		background: var(--status-red-bg);
	}

	.media {
		color: var(--status-blue);
		background: var(--status-blue-bg);
	}

	.baixa {
		color: var(--black);
	}
	.status {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-weight: 600;
		white-space: nowrap;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
	}
	.triagem,
	.analise {
		color: var(--status-blue);
	}

	.processado {
		color: var(--status-green);
	}

	.cancelado {
		color: var(--status-red);
	}

	.table-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md);
	}

	.table-footer p {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
	}
	@media (max-width: 768px) {
		.table-footer {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-md);
		}

		.pagination {
			align-self: flex-end;
		}
	}
	.pagination {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.pagination button {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font: var(--label);
	}

	.pagination .active {
		min-width: 32px;
		padding: var(--spacing-sm);
		background: var(--secondary-color);
		color: var(--white);
	}
</style>
