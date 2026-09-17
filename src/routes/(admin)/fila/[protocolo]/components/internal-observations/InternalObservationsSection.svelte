<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import {
		loadInternalObservations,
		submitInternalObservation
	} from '$lib/services/internal-observations.service';
	import type { InternalObservation } from '$lib/types/internal-observation';
	import type { InternalRequestDetail } from '$lib/types/request';

	interface Props {
		solicitation: InternalRequestDetail;
		onCountChange?: (count: number) => void;
	}

	let { solicitation, onCountChange }: Props = $props();

	let observations = $state<InternalObservation[]>([]);
	let draft = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let loadError = $state('');
	let submitError = $state('');

	const legacyObservation = $derived(solicitation.internalObservations?.trim() ?? '');
	const canSubmit = $derived(draft.trim().length > 0 && !loading && !submitting);

	function formatDateTime(value: string): string {
		const date = new Date(value);

		if (Number.isNaN(date.getTime())) {
			return value;
		}

		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function getInitials(name: string): string {
		return name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part.charAt(0))
			.join('')
			.toUpperCase();
	}

	function isAnalyst(observation: InternalObservation): boolean {
		return observation.author.role.toLowerCase().includes('analista');
	}
	async function load() {
		loading = true;
		loadError = '';

		const result = await loadInternalObservations(solicitation.protocol);

		if (result.ok) {
			observations = result.data.observations;
			onCountChange?.(observations.length);
		} else {
			loadError = result.error.message;
		}

		loading = false;
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		submitting = true;
		submitError = '';

		const result = await submitInternalObservation(solicitation.protocol, draft);

		if (result.ok) {
			observations = [...observations, result.data];
			onCountChange?.(observations.length);
			draft = '';
		} else {
			submitError = result.error.message;
		}

		submitting = false;
	}
	onMount(() => {
		void load();
	});
</script>

<section class="internal-observations" aria-labelledby="internal-observations-title">
	<header class="section-header">
		<div class="section-avatar" aria-hidden="true">
			<Icon iconName="edit" iconSize="md" />
		</div>

		<div class="section-heading">
			<h2 id="internal-observations-title">Observações Internas</h2>
			<p>Essas anotações estão disponíveis apenas internamente.</p>
		</div>
	</header>

	<div class="observations-body" aria-live="polite">
		{#if loading}
			<div class="empty-state">
				<p>Carregando observações internas...</p>
			</div>
		{:else if loadError}
			<div class="empty-state" role="alert">
				<p>{loadError}</p>
			</div>
		{:else if observations.length > 0}
			<div class="timeline-event">
				<span>▣ Demanda registrada no portal em {formatDateTime(solicitation.openedAt)}</span>
			</div>

			<div class="timeline">
				{#each observations as observation (observation.id)}
					<article
						class="observation-entry"
						class:observation-entry--right={isAnalyst(observation)}
					>
						<div class="observation-header">
							{#if !isAnalyst(observation)}
								<div class="author-avatar author-avatar--light" aria-hidden="true">
									{getInitials(observation.author.name)}
								</div>
							{/if}

							<div class="observation-meta" class:observation-meta--right={isAnalyst(observation)}>
								{#if isAnalyst(observation)}
									<time datetime={observation.createdAt}>
										{formatDateTime(observation.createdAt)}
									</time>
								{/if}

								<strong>
									{observation.author.name} ({observation.author.role})
								</strong>

								{#if !isAnalyst(observation)}
									<time datetime={observation.createdAt}>
										{formatDateTime(observation.createdAt)}
									</time>
								{/if}
							</div>

							{#if isAnalyst(observation)}
								<div class="author-avatar author-avatar--primary" aria-hidden="true">
									{getInitials(observation.author.name)}
								</div>
							{/if}
						</div>

						<div
							class="observation-bubble"
							class:observation-bubble--primary={isAnalyst(observation)}
						>
							<p>{observation.content}</p>
						</div>
					</article>
				{/each}
			</div>
		{:else if legacyObservation}
			<div class="legacy-observation">
				<p>{legacyObservation}</p>
			</div>
		{:else}
			<div class="empty-state">
				<p>Nenhuma observação interna registrada.</p>
			</div>
		{/if}
	</div>

	<div class="composer">
		<Textarea
			id="internal-observation-composer"
			placeholder="Faça uma observação interna"
			bind:value={draft}
			disabled={loading || submitting}
		/>

		<div class="composer-footer">
			<p class:submit-error={submitError}>{submitError}</p>

			<Button type="button" disabled={!canSubmit} loading={submitting} onclick={handleSubmit}>
				Enviar
			</Button>
		</div>
	</div>
</section>

<style>
	.internal-observations {
		display: flex;
		flex-direction: column;
		margin-top: var(--spacing-md);
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		overflow: hidden;
		font-family: var(--font-inter);
		background: var(--white);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--white-gray);
	}

	.section-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--background-color);
		color: var(--primary-color);
		font-size: 13px;
		font-weight: 700;
	}

	.section-heading h2 {
		margin: 0;
		color: var(--secondary-color);
		font-size: 14px;
		font-weight: 600;
	}

	.section-heading p {
		margin: 3px 0 0;
		color: var(--gray);
		font-size: 12px;
		line-height: 1.4;
	}

	.observations-body {
		display: flex;
		flex-direction: column;
		min-height: 360px;
		padding: 0 var(--spacing-md) var(--spacing-md);
	}

	.timeline-event {
		display: flex;
		justify-content: center;
		margin-bottom: 28px;
	}

	.timeline-event span {
		padding: 7px 14px;
		border: 1px solid var(--white-gray);
		border-radius: 999px;
		background: var(--background-color);
		color: var(--gray);
		font-size: 12px;
		line-height: 1;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.observation-entry {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
	}

	.observation-entry--right {
		align-items: flex-end;
	}

	.observation-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
	}

	.observation-entry--right .observation-header {
		justify-content: flex-end;
	}

	.author-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		font-size: 11px;
		font-weight: 700;
	}

	.author-avatar--light {
		background: var(--background-color);
		color: var(--primary-color);
	}

	.author-avatar--primary {
		background: var(--primary-color);
		color: var(--white);
	}

	.observation-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 34px;
	}

	.observation-meta--right {
		justify-content: flex-end;
	}

	.observation-meta strong {
		color: var(--primary-color);
		font-size: 12px;
		font-weight: 600;
	}

	.observation-meta time {
		color: var(--gray);
		font-size: 12px;
		white-space: nowrap;
	}

	.observation-bubble,
	.legacy-observation {
		width: min(56%, 680px);
		box-sizing: border-box;
		padding: 16px 18px;
		border: 1px solid var(--white-gray);
		border-radius: 0 16px 16px 16px;
		background: var(--white);
	}

	.observation-entry--right .observation-bubble {
		margin-right: 44px;
	}

	.observation-entry:not(.observation-entry--right) .observation-bubble {
		margin-left: 44px;
	}

	.observation-bubble--primary {
		border-color: var(--primary-color);
		border-radius: 16px 0 16px 16px;
		background: var(--primary-color);
		color: var(--white);
	}

	.observation-bubble p,
	.legacy-observation p,
	.empty-state p {
		margin: 0;
		font-size: 13px;
		line-height: 1.6;
	}

	.observation-bubble p,
	.legacy-observation p {
		white-space: pre-wrap;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		min-height: 300px;
		color: var(--gray);
		text-align: center;
	}

	.composer {
		padding: var(--spacing-md);
		border-top: 1px solid var(--white-gray);
	}

	.composer-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-top: 10px;
	}

	.composer-footer p {
		margin: 0;
		min-height: 17px;
		color: var(--gray);
		font-size: 12px;
		line-height: 1.4;
	}

	.composer-footer .submit-error {
		color: var(--error-color, #b42318);
	}

	@media (max-width: 640px) {
		.observation-bubble,
		.legacy-observation {
			width: calc(100% - 44px);
		}

		.observation-meta {
			flex-wrap: wrap;
		}

		.composer-footer {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
