<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { listRequests } from '$lib/services/request.service';
	import type { RequestSummary, RequestPriority, RequestStatus } from '$lib/types/request';
	import Icon from '$lib/components/Icon.svelte';

	// Estado da página
	let requests = $state<RequestSummary[]>([]);
	let assignedCount = $state<number>(0);
	let loading = $state<boolean>(true);
	let errorMessage = $state<string | null>(null);

	// Padrões de Paginação
	let currentPage = $state<number>(1);
	let pageSize = $state<number>(10);
	let totalItems = $state<number>(0);
	let totalPages = $state<number>(1);

	// Dados do usuário logado
	let user = $derived(page.data.user);
	let userName = $derived(user?.name ?? 'Usuário');
	let userEmail = $derived(user?.email ?? '');

	async function fetchDashboardData(pageNumber = 1) {
		loading = true;
		errorMessage = null;

		const result = await listRequests({
			email: userEmail,
			page: pageNumber,
			pageSize
		});

		if (result.ok) {
			const allData = result.data.data;

			// Tabela: Filtra apenas solicitações sem responsável (assignee === null ou vazio)
			requests = allData.filter((req) => !req.assignee);

			// Contagem: Atribuídas ao usuário atual
			assignedCount = allData.filter((req) => req.assignee === userName).length;

			// Paginação
			currentPage = result.data.page;
			totalItems = requests.length;
			totalPages = Math.ceil(totalItems / pageSize) || 1;
		} else {
			errorMessage = result.error.message;
		}

		loading = false;
	}

	function formatDate(dateString: string): { date: string; time: string } {
		if (!dateString) return { date: '-', time: '-' };
		const d = new Date(dateString);
		if (isNaN(d.getTime())) return { date: dateString, time: '' };

		const date = d.toLocaleDateString('pt-BR');
		const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
		return { date, time };
	}

	function getStatusClass(status: RequestStatus): string {
		switch (status) {
			case 'Em triagem':
			case 'Em análise de viabilidade':
			case 'Em mapeamento':
				return 'status-blue';
			case 'Concluído':
			case 'Elegível':
				return 'status-green';
			case 'Cancelado':
			case 'Não elegível':
				return 'status-red';
			default:
				return 'status-yellow';
		}
	}

	function getPriorityClass(priority: RequestPriority | null): string {
		switch (priority) {
			case 'Crítica':
			case 'Alta':
				return 'priority-critica';
			case 'Média':
				return 'priority-media';
			case 'Baixa':
			default:
				return 'priority-baixa';
		}
	}

	function changePage(newPage: number) {
		if (newPage >= 1 && newPage <= totalPages) {
			fetchDashboardData(newPage);
		}
	}

	onMount(() => {
		fetchDashboardData();
	});
</script>

<div class="content-container dashboard">
	<!-- Banner Hero de Saudação -->
	<section class="hero-banner">
		<div class="hero-content">
			<h1>Bem-vindo de volta, {userName}.</h1>
			<p>
				Você possui <strong>{assignedCount}</strong> solicitações das quais você está como responsável.
			</p>
		</div>
		<div class="hero-watermark" aria-hidden="true">
			<span>NEO</span>
			<span>NEO</span>
		</div>
	</section>

	<!-- Tabela de Solicitações sem responsável -->
	<section class="table-section">
		<h2>Solicitações sem responsável</h2>

		{#if loading}
			<div class="state-container">
				<span class="spinner" aria-hidden="true"></span>
				<p>Carregando solicitações...</p>
			</div>
		{:else if errorMessage}
			<div class="state-container error">
				<p>{errorMessage}</p>
				<button class="btn-retry" onclick={() => fetchDashboardData(currentPage)}>
					Tentar novamente
				</button>
			</div>
		{:else if requests.length === 0}
			<div class="state-container empty">
				<p>Nenhuma solicitação sem responsável encontrada no momento.</p>
			</div>
		{:else}
			<div class="table-wrapper">
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
						{#each requests as req (req.protocol)}
							{@const formatted = formatDate(req.createdAt)}
							<tr>
								<td class="protocol-cell">
									<a href={resolve(`/fila/${req.protocol}`)}>
										#{req.protocol}
									</a>
								</td>
								<td class="date-cell">
									<span class="date">{formatted.date}</span>
									<span class="time">{formatted.time}</span>
								</td>
								<td class="process-cell">
									<strong>{req.processName}</strong>
								</td>
								<td>
									{#if req.priority}
										<span class="priority-badge {getPriorityClass(req.priority)}">
											{req.priority.toUpperCase()}
										</span>
									{:else}
										<span class="priority-none">-</span>
									{/if}
								</td>
								<td>
									<span class="status-indicator {getStatusClass(req.status)}">
										<span class="dot" aria-hidden="true"></span>
										{req.status}
									</span>
								</td>
								<td class="assignee-cell">Nenhum</td>
								<td class="requester-cell">{req.requesterName}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Paginação -->
			<footer class="pagination-container">
				<span class="pagination-info">
					Mostrando 1-{requests.length} de {totalItems} solicitações
				</span>

				<div class="pagination-controls">
					<button
						class="page-btn"
						disabled={currentPage === 1}
						onclick={() => changePage(currentPage - 1)}
						aria-label="Página anterior"
					>
						<Icon iconName="arrowForward" iconSize="sm" />
					</button>

					<span class="page-number active">{currentPage}</span>

					<button
						class="page-btn"
						disabled={currentPage === totalPages}
						onclick={() => changePage(currentPage + 1)}
						aria-label="Próxima página"
					>
						<Icon iconName="arrowForward" iconSize="sm" />
					</button>
				</div>
			</footer>
		{/if}
	</section>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		width: 100%;
		padding-bottom: var(--spacing-xl);
	}

	.hero-banner {
		position: relative;
		background: var(--gradient);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		color: var(--white);
		overflow: hidden;
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 180px;
		box-shadow: var(--regular-shadow);
	}

	.hero-content {
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.hero-content h1 {
		color: var(--white);
		font: var(--h2);
		margin: 0;
	}

	.hero-content p {
		font: var(--paragrafo);
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
	}

	.hero-watermark {
		position: absolute;
		right: -20px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		opacity: 0.08;
		font-family: var(--font-montserrat);
		font-size: 110px;
		font-weight: 900;
		line-height: 0.8;
		user-select: none;
		pointer-events: none;
		color: var(--white);
	}

	.table-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.table-section h2 {
		font: var(--h3);
		color: var(--rich-black);
	}

	.table-wrapper {
		background-color: var(--white);
		border-radius: var(--radius-md);
		border: var(--border-default);
		overflow-x: auto;
		box-shadow: var(--regular-shadow);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font: var(--paragrafo);
		font-size: 14px;
	}

	thead tr {
		border-bottom: var(--border-default);
		background-color: #fafbfc;
	}

	th {
		padding: var(--spacing-md);
		font: var(--label);
		font-size: 11px;
		color: var(--gray);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	tbody tr {
		border-bottom: var(--border-default);
		transition: var(--transition-default);
	}

	tbody tr:last-child {
		border-bottom: none;
	}

	tbody tr:hover {
		background-color: #f8fafc;
	}

	td {
		padding: var(--spacing-md);
		vertical-align: middle;
		color: var(--black);
	}

	.protocol-cell a {
		color: var(--secondary-color);
		font-weight: 600;
		text-decoration: none;
	}

	.protocol-cell a:hover {
		text-decoration: underline;
	}

	.date-cell {
		display: flex;
		flex-direction: column;
		font-size: 13px;
	}

	.date-cell .time {
		color: var(--gray);
		font-size: 12px;
	}

	.process-cell strong {
		color: var(--rich-black);
	}

	.priority-badge {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-align: center;
	}

	.priority-critica {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.priority-media {
		background-color: #dbeafe;
		color: #1e40af;
	}

	.priority-baixa {
		background-color: #f3f4f6;
		color: var(--gray);
	}

	.priority-none {
		color: var(--gray);
	}

	.status-indicator {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
		font-size: 13px;
	}

	.status-indicator .dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}

	.status-blue {
		color: var(--secondary-color);
	}
	.status-blue .dot {
		background-color: var(--secondary-color);
	}

	.status-green {
		color: #10b981;
	}
	.status-green .dot {
		background-color: #10b981;
	}

	.status-red {
		color: #ef4444;
	}
	.status-red .dot {
		background-color: #ef4444;
	}

	.status-yellow {
		color: #d97706;
	}
	.status-yellow .dot {
		background-color: #d97706;
	}

	.assignee-cell {
		color: var(--gray);
	}

	.requester-cell {
		color: var(--black);
	}

	.pagination-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md);
		background-color: var(--white);
		border-radius: var(--radius-md);
		border: var(--border-default);
	}

	.pagination-info {
		font-size: 13px;
		color: var(--gray);
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.page-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		color: var(--gray);
		border-radius: 4px;
	}

	.page-btn:first-child {
		transform: rotate(180deg);
	}

	.page-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.page-number.active {
		background-color: var(--secondary-color);
		color: var(--white);
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		font-weight: 600;
		font-size: 13px;
	}

	.state-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xl);
		background-color: var(--white);
		border-radius: var(--radius-md);
		border: var(--border-default);
		gap: var(--spacing-md);
		color: var(--gray);
	}

	.btn-retry {
		background-color: var(--primary-color);
		color: var(--white);
		border: none;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--white-gray);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
