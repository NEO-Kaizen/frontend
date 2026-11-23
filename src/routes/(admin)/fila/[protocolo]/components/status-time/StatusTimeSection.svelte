<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import {
		filterStatusAuditEvents,
		getRequestAuditLogs,
		getStatusTimes
	} from '$lib/services/status-time.service';
	import type { RequestAuditEvent } from '$lib/types/audit';
	import type { StatusTimesResponse } from '$lib/types/status-time';
	import StatusTimeCards from './StatusTimeCards.svelte';
	import StatusTimeEvents from './StatusTimeEvents.svelte';
	import StatusTimeTable from './StatusTimeTable.svelte';
	import StatusTimeTimeline from './StatusTimeTimeline.svelte';

	interface Props {
		protocol: string;
	}

	let { protocol }: Props = $props();

	let times = $state<StatusTimesResponse | null>(null);
	let events = $state<RequestAuditEvent[]>([]);
	let isLoading = $state(true);
	let isEventsLoading = $state(true);
	let errorMessage = $state<string | null>(null);
	let errorStatus = $state<number | undefined>(undefined);
	let eventsError = $state<string | null>(null);
	let eventsErrorStatus = $state<number | undefined>(undefined);

	// A aba só monta o componente quando é aberta (e o `SpecTabs` o remonta
	// quando uma ação altera o histórico de Status). Cada consulta tem sua
	// geração para descartar respostas antigas sem bloquear a outra.
	let timesGeneration = 0;
	let eventsGeneration = 0;

	async function loadTimes(): Promise<void> {
		const generation = ++timesGeneration;
		isLoading = true;
		errorMessage = null;
		errorStatus = undefined;

		const result = await getStatusTimes(protocol);
		if (generation !== timesGeneration) return;

		if (result.ok) {
			times = result.data;
		} else {
			times = null;
			errorMessage = result.error.message;
			errorStatus = result.error.status;
		}
		isLoading = false;
	}

	async function loadEvents(): Promise<void> {
		const generation = ++eventsGeneration;
		isEventsLoading = true;
		eventsError = null;
		eventsErrorStatus = undefined;

		const result = await getRequestAuditLogs(protocol);
		if (generation !== eventsGeneration) return;

		if (result.ok) {
			events = filterStatusAuditEvents(result.data);
		} else {
			events = [];
			eventsError = result.error.message;
			eventsErrorStatus = result.error.status;
		}
		isEventsLoading = false;
	}

	// Consultas independentes: os tempos não esperam a auditoria para serem
	// exibidos, e uma falha nos eventos não esconde cards/tabela/timeline.
	function load(): void {
		void loadTimes();
		void loadEvents();
	}

	onMount(() => {
		void load();
	});
</script>

<section class="status-time-section" aria-labelledby="status-time-title" aria-busy={isLoading}>
	<header class="section-header">
		<div>
			<h3 id="status-time-title" class="section-title">Tempo por Status</h3>
			<p class="section-subtitle">
				Tempo cronológico registrado em cada etapa da solicitação, calculado pelo sistema.
			</p>
		</div>
	</header>

	{#if isLoading}
		<div class="state" role="status" aria-live="polite" aria-busy="true">
			<span class="spinner" aria-hidden="true"></span>
			<p>Carregando tempo por Status…</p>
		</div>
	{:else if errorMessage}
		<div class="state state-error" role="alert">
			<p>{errorMessage}</p>
			{#if errorStatus !== 403}
				<Button variant="outline-neutral" onclick={() => void loadTimes()}>Tentar novamente</Button>
			{/if}
		</div>
	{:else if times}
		{#if times.intervals.length === 0 && times.totalsByStatus.length === 0}
			<p class="empty-state" role="status">
				Ainda não há tempo registrado por Status para esta solicitação.
			</p>
		{:else}
			<div class="status-time-content">
				<StatusTimeCards
					{times}
					onRefresh={() => void load()}
					isRefreshing={isLoading || isEventsLoading}
				/>

				{#if times.totalsByStatus.length > 0}
					<StatusTimeTable totals={times.totalsByStatus} />
				{/if}

				{#if times.intervals.length > 0}
					<StatusTimeTimeline intervals={times.intervals} calculatedAt={times.calculatedAt} />
				{/if}
			</div>
		{/if}

		<StatusTimeEvents
			{events}
			error={eventsError}
			errorStatus={eventsErrorStatus}
			isLoading={isEventsLoading}
			onRetry={() => void loadEvents()}
		/>
	{/if}
</section>

<style>
	.status-time-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		min-width: 0;
	}

	.section-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
	}

	.section-title {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 16px;
		font-weight: 700;
		color: var(--black);
	}

	.section-subtitle {
		margin: 4px 0 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--secondary-color);
	}

	.status-time-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lp);
	}

	.state {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-xl) var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		text-align: center;
	}

	.state p {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--secondary-color);
	}

	.state-error {
		border-color: var(--status-red);
		background: var(--status-red-bg);
	}

	.state-error p {
		color: var(--status-red);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--white-gray);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 800ms linear infinite;
	}

	.empty-state {
		margin: 0;
		padding: var(--spacing-xl) var(--spacing-md);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		text-align: center;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--secondary-color);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
