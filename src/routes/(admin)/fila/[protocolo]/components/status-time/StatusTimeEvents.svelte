<script lang="ts">
	import { getActionLabel } from '$lib/audit/audit-labels';
	import type { RequestAuditEvent } from '$lib/types/audit';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		events: RequestAuditEvent[];
	}

	let { events }: Props = $props();

	// A API não garante ordem: a listagem é sempre do evento mais recente para
	// o mais antigo, sem alterar os dados recebidos.
	const sortedEvents = $derived.by(() =>
		[...events].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
	);

	function originLabel(origin: string | null): string {
		switch (origin) {
			case 'admin':
				return 'Administrador';
			case 'internal':
				return 'Interno';
			case 'system':
				return 'Sistema';
			case 'requester':
				return 'Solicitante';
			default:
				return 'Não informada';
		}
	}

	function actorLabel(event: RequestAuditEvent): string {
		return event.actor.kind === 'system' ? 'Sistema' : (event.actor.displayName ?? 'Não informado');
	}
</script>

<section class="events-section" aria-labelledby="status-time-events-title">
	<h4 id="status-time-events-title" class="section-title">Eventos de mudança de Status</h4>

	<ul class="event-list">
		{#each sortedEvents as event (event.audit_id)}
			<li class="event-item">
				<div class="event-heading">
					<strong class="event-action">{getActionLabel(event.action_type)}</strong>
					<time datetime={event.occurred_at}>{formatDateTime(event.occurred_at)}</time>
				</div>

				<p class="event-transition" aria-label="Status anterior e novo Status">
					<span class="status-from">{event.previous_value ?? '—'}</span>
					<span aria-hidden="true">→</span>
					<span class="status-to">{event.new_value ?? '—'}</span>
				</p>

				<dl class="event-meta">
					<dt>Operador</dt>
					<dd>{actorLabel(event)}</dd>

					<dt>Origem</dt>
					<dd>{originLabel(event.change_origin)}</dd>

					<dt>Nota</dt>
					<dd>{event.note ?? 'Sem nota registrada'}</dd>
				</dl>
			</li>
		{/each}
	</ul>
</section>

<style>
	.events-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.section-title {
		margin: 0;
		font: var(--label);
		color: var(--secondary-color);
	}

	.event-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.event-item {
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		min-width: 0;
	}

	.event-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.event-action {
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
	}

	.event-heading time {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--secondary-color);
	}

	.event-transition {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
	}

	.status-from {
		color: var(--secondary-color);
	}

	.status-to {
		font-weight: 700;
		color: var(--primary-color);
	}

	.event-meta {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		column-gap: var(--spacing-md);
		row-gap: 4px;
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
	}

	.event-meta dt {
		font-weight: 600;
		color: var(--secondary-color);
	}

	.event-meta dd {
		margin: 0;
		color: var(--black);
		overflow-wrap: anywhere;
	}
</style>
