<script lang="ts">
	let pesquisou = $state(false);
	let protocolo = $state('');
	let email = $state('');

	function consultarProtocolo() {
		if (!protocolo && !email) {
			console.log('Preencha o protocolo ou o e-mail.');
			return;
		}

		resultados = solicitacoes.filter((solicitacao) => {
			const protocoloEncontrado =
				!protocolo || solicitacao.protocolo.toLowerCase().includes(protocolo.trim().toLowerCase());

			const emailEncontrado =
				!email || solicitacao.solicitante.toLowerCase().includes(email.trim().toLowerCase());

			return protocoloEncontrado && emailEncontrado;
		});

		paginaAtual = 1;
		pesquisou = true;
	}

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

	// mantém sua paginação abaixo
	let paginaAtual = $state(1);

	const itensPorPagina = 4;

	let totalPaginas = $derived(Math.ceil(resultados.length / itensPorPagina));

	let inicio = $derived((paginaAtual - 1) * itensPorPagina);

	let fim = $derived(inicio + itensPorPagina);

	let solicitacoesPagina = $derived(resultados.slice(inicio, fim));
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

		<div class="consulta">
			<div class="campo">
				<label for="protocolo">Número do Protocolo</label>

				<div class="input-container">
					<span class="input-icon">#</span>

					<input
						id="protocolo"
						type="text"
						placeholder="Ex: NEO-2026-000102"
						bind:value={protocolo}
					/>
				</div>
			</div>

			<div class="campo">
				<label for="email">E-mail Corporativo</label>

				<div class="input-container">
					<span class="input-icon">@</span>

					<input
						id="email"
						type="email"
						placeholder="emaildofulano@neo.com.br"
						bind:value={email}
					/>
				</div>
			</div>

			<button type="button" class="consultar" onclick={consultarProtocolo}>
				Consultar Protocolo
			</button>
		</div>
		<!-- A .consulta TERMINA AQUI -->

		<!-- TABELA COMEÇA FORA DA .consulta -->
		{#if pesquisou}
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
								Mostrando 1-{solicitacoes.length} de
								{solicitacoes.length} solicitações
							</p>

							<div class="pagination">
								<button type="button" onclick={paginaAnterior} disabled={paginaAtual === 1}>
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
		{/if}
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

	.consulta {
		display: flex;
		align-items: flex-end;
		width: 100%;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
	}

	.campo {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.campo label {
		margin-bottom: var(--spacing-sm);
		color: var(--black);
	}

	.input-container {
		display: flex;
		align-items: center;
		width: 100%;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
	}

	.input-icon {
		padding-left: var(--spacing-md);
		color: var(--gray);
		font: var(--paragrafo);
	}

	.input-container input {
		width: 100%;
		padding: var(--spacing-md);
		border: none;
		outline: none;
		background: transparent;
		color: var(--black);
		font: var(--paragrafo);
	}

	.input-container:focus-within {
		border-color: var(--secondary-color);
	}

	.consultar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-xl);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--primary-color);
		color: var(--white);
		cursor: pointer;
		white-space: nowrap;
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
