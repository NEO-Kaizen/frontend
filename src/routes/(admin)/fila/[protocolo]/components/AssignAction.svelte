<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicInOut, cubicOut } from 'svelte/easing';
	import Modal from '$lib/components/Modal.svelte';
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import { CATEGORY_OPTIONS } from '$lib/types/request';
	import type { Analyst } from '$lib/types/user';
	import { listAnalysts, assignAnalyst } from '$lib/services/assignment.service';
	import type { InternalRequestDetail } from '$lib/types/request';

	interface Props {
		protocol: string;
		currentAssigneeId: string | null;
		currentAssigneeName?: string | null;
		currentMappingAssigneeId?: string | null;
		currentMappingAssigneeName?: string | null;
		currentAssigneeDeadline?: string | null;
		onclose: () => void;
		onSuccess: (updated: InternalRequestDetail) => void;
	}

	let {
		protocol,
		currentAssigneeId,
		currentAssigneeName = null,
		currentMappingAssigneeId = null,
		currentMappingAssigneeName = null,
		currentAssigneeDeadline = null,
		onclose,
		onSuccess
	}: Props = $props();

	// Props de mapeamento mantidas para compatibilidade do patch, mas UI não altera com elas
	// svelte-ignore state_referenced_locally
	void currentMappingAssigneeId;
	// svelte-ignore state_referenced_locally
	void currentMappingAssigneeName;

	let analysts = $state<Analyst[]>([]);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let searchText = $state('');
	let searchCategory = $state('');
	// svelte-ignore state_referenced_locally
	let selectedId = $state<string | null>(currentAssigneeId ?? null);
	let isSaving = $state(false);
	let responsibility = $state<'triagem' | 'mapeamento' | null>(null);
	// svelte-ignore state_referenced_locally
	let deadline = $state<string>(currentAssigneeDeadline ?? '');
	let deadlineError = $state<string>('');

	function getTodayIsoDate(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	const todayIso = getTodayIsoDate();

	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const isReassign = $derived(currentAssigneeId !== null && currentAssigneeId !== '');

	const currentAnalyst = $derived(analysts.find((a) => a.id === currentAssigneeId) ?? null);
	const currentAssigneeDisplayName = $derived(
		currentAnalyst?.fullName ?? currentAssigneeName ?? null
	);

	function normalize(text: string): string {
		return text
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase()
			.trim();
	}

	const categoryOptions = $derived.by(() => {
		return [
			{ value: '', label: 'Todas as categorias' },
			...CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
		];
	});

	const filtered = $derived.by(() => {
		let result = analysts;
		const term = normalize(searchText);
		if (term) {
			result = result.filter(
				(a) => normalize(a.fullName).includes(term) || normalize(a.specialty ?? '').includes(term)
			);
		}
		if (searchCategory) {
			result = result.filter((a) => a.categories?.includes(searchCategory as never));
		}
		return result;
	});

	const selectedAnalyst = $derived(analysts.find((a) => a.id === selectedId) ?? null);

	async function loadAnalysts(): Promise<void> {
		isLoading = true;
		loadError = null;
		const result = await listAnalysts();
		if (result.ok) {
			// Backend retorna só ativos — lista direta sem paginação, filtros no front
			analysts = result.data as Analyst[];
			isLoading = false;
		} else {
			loadError = result.error.message ?? 'Não foi possível carregar os analistas.';
			isLoading = false;
		}
	}

	onMount(() => {
		void loadAnalysts();
	});

	function handleSelect(id: string): void {
		if (selectedId === id) {
			selectedId = null;
		} else {
			selectedId = id;
		}
		submitError = null;
	}

	let submitError = $state<string | null>(null);

	function validateDeadline(value: string): string {
		if (!value) return '';
		if (value < todayIso) return 'O prazo não pode ser anterior a hoje.';
		return '';
	}

	function handleDeadlineChange(value: string): void {
		deadline = value;
		deadlineError = validateDeadline(value);
		if (!deadlineError) submitError = null;
	}

	async function handleSubmit(): Promise<void> {
		if (!selectedId || isSaving) return;
		if (!responsibility) {
			submitError = 'Selecione a responsabilidade (Triagem ou Mapeamento).';
			return;
		}
		const deadlineValidation = validateDeadline(deadline);
		if (deadlineValidation) {
			deadlineError = deadlineValidation;
			submitError = deadlineValidation;
			return;
		}
		isSaving = true;
		submitError = null;
		const result = await assignAnalyst(
			protocol,
			selectedId,
			responsibility,
			deadline ? deadline : null
		);
		isSaving = false;
		if (result.ok) {
			onSuccess(result.data);
			onclose();
		} else {
			submitError = result.error.message;
			if (submitError.toLowerCase().includes('prazo')) {
				deadlineError = submitError;
			}
		}
	}

	function handleResponsibilityChange(value: 'triagem' | 'mapeamento'): void {
		responsibility = value;
		submitError = null;
	}

	function handleRetry(): void {
		void loadAnalysts();
	}
</script>

<Modal title={isReassign ? 'Atribuir um novo analista' : 'Atribuir analista'} size="lg" {onclose}>
	<div
		class="assign-content"
		in:fly={{
			y: prefersReducedMotion ? 0 : 10,
			duration: prefersReducedMotion ? 0 : 260,
			easing: cubicOut
		}}
		out:fly={{
			y: prefersReducedMotion ? 0 : 8,
			duration: prefersReducedMotion ? 0 : 340,
			easing: cubicInOut
		}}
	>

		{#if isReassign && currentAssigneeDisplayName}
			<div class="current-banner" role="status" aria-label="Responsável atual">
				<Icon iconName="person" iconSize="sm" />
				<span>Responsável atual: <strong>{currentAssigneeDisplayName}</strong> — {currentAssigneeId === currentMappingAssigneeId ? "Mapeamento" : "Triagem"}</span>
			</div>
		{/if}

		<div class="filters-row">
			<div class="filter-field">
				<Input
					icon="search"
					placeholder="Pesquisar Analista"
					bind:value={searchText}
					aria-label="Pesquisar por nome ou especialidade"
				/>
			</div>
			<div class="filter-field">
				<FilterSelect
					options={categoryOptions}
					value={searchCategory}
					onchange={(v) => (searchCategory = v)}
					placeholder="Todas as categorias"
					icon="category"
					ariaLabel="Filtrar por categoria"
					clearValue=""
				/>
			</div>
		</div>

		<div class="list-wrapper" aria-live="polite" aria-busy={isLoading}>
			{#if isLoading}
				<div class="skeleton-list" aria-label="Carregando analistas">
					{#each [0, 1, 2] as idx (idx)}
						<div class="skeleton-card" style:animation-delay={`${idx * 80}ms`}>
							<div class="skeleton-line short"></div>
							<div class="skeleton-line"></div>
							<div class="skeleton-line tiny"></div>
						</div>
					{/each}
				</div>
			{:else if loadError}
				<div class="state-message error" role="alert">
					<p>{loadError}</p>
					<Button variant="outline-neutral" onclick={handleRetry}>Tentar novamente</Button>
				</div>
			{:else if filtered.length === 0}
				<div class="state-message empty">
					<p>Nenhum analista encontrado</p>
					<span class="empty-hint">Tente limpar os filtros ou ajustar a pesquisa.</span>
					{#if searchText.trim() || searchCategory}
						<Button
							variant="outline-neutral"
							onclick={() => {
								searchText = '';
								searchCategory = '';
							}}
						>
							Limpar filtros
						</Button>
					{/if}
				</div>
			{:else}
				<ul class="analyst-list" role="listbox" aria-label="Lista de analistas">
					{#each filtered as analyst, index (analyst.id)}
						<li
							class="analyst-card"
							class:selected={selectedId === analyst.id}
							role="option"
							aria-selected={selectedId === analyst.id}
							in:fly={{
								y: prefersReducedMotion ? 0 : 8,
								duration: prefersReducedMotion ? 0 : 220,
								delay: prefersReducedMotion ? 0 : index * 40,
								easing: cubicOut
							}}
						>
							<button
								type="button"
								class="card-main"
								onclick={() => handleSelect(analyst.id)}
								aria-label={`Selecionar ${analyst.fullName}`}
							>
								<span class="card-left">
									<span
										class="checkbox"
										class:checked={selectedId === analyst.id}
										aria-hidden="true"
									>
										{#if selectedId === analyst.id}
											<span
												class="check-mark"
												in:scale={{ duration: prefersReducedMotion ? 0 : 140, start: 0.6 }}
											>
												<Icon iconName="check" iconSize="sm" />
											</span>
										{/if}
									</span>
								</span>

								<span class="card-center">
									<span class="name-row">
										<span class="analyst-name">{analyst.fullName}</span>
										{#if analyst.id === currentAssigneeId}
											<span class="current-badge" aria-label="Responsável atual">Atual: {currentAssigneeId === currentMappingAssigneeId ? "mapeamento" : "pela triagem"}</span>
										{/if}
									</span>
									{#if analyst.specialty && analyst.specialty.trim()}
										<span class="analyst-specialty">{analyst.specialty}</span>
									{/if}
									{#if analyst.categories && analyst.categories.length > 0}
										<span class="category-chips">
											{#each analyst.categories as cat (cat)}
												<span class="chip">{cat}</span>
											{/each}
										</span>
									{/if}
									{#if analyst.notes && analyst.notes.trim()}
										<span class="notes-block">
											<span class="notes-label">NOTAS</span>
											<span class="notes-text">{analyst.notes}</span>
										</span>
									{/if}
								</span>

								{#if analyst.requestLoad !== null && analyst.requestLoad !== undefined}
									<span class="card-right">
										<span class="load-number">{analyst.requestLoad}</span>
										<span class="load-label"
											>{analyst.requestLoad === 1 ? 'demanda' : 'demandas'}</span
										>
									</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if submitError}
			<p class="submit-error" role="alert">{submitError}</p>
		{/if}

		<footer class="assign-footer">
			<div class="footer-group">
				<div
					class="responsibility-group"
					role="radiogroup"
					aria-label="Responsabilidade do analista"
				>
					<span class="responsibility-title">Responsável por:</span>
					<label class="radio-option" class:selected={responsibility === 'triagem'}>
						<input
							type="radio"
							name="responsibility"
							value="triagem"
							bind:group={responsibility}
							onchange={() => handleResponsibilityChange('triagem')}
							aria-label="Triagem"
						/>
						<span class="radio-indicator" aria-hidden="true"></span>
						Triagem
					</label>
					<label class="radio-option" class:selected={responsibility === 'mapeamento'}>
						<input
							type="radio"
							name="responsibility"
							value="mapeamento"
							bind:group={responsibility}
							onchange={() => handleResponsibilityChange('mapeamento')}
							aria-label="Mapeamento"
						/>
						<span class="radio-indicator" aria-hidden="true"></span>
						Mapeamento
					</label>
				</div>
				<div class="deadline-field">
					<span class="responsibility-title">Prazo:</span>
					<Input
						type="date"
						bind:value={deadline}
						min={todayIso}
						error={deadlineError}
						aria-label="Prazo da atribuição"
						oninput={() => handleDeadlineChange(deadline)}
					/>
				</div>
			</div>

			<div class="footer-actions">
				<span class="footer-left">
					{#if selectedAnalyst}
						{#if isReassign && currentAssigneeDisplayName && selectedId !== currentAssigneeId}
							<span in:fade={{ duration: prefersReducedMotion ? 0 : 150 }}>
								Alterando de <strong>{currentAssigneeDisplayName}</strong> para
								<strong class="selected-name">{selectedAnalyst.fullName}</strong>
							</span>
						{:else if isReassign && selectedId === currentAssigneeId}
							<span class="muted"
								>Mantendo {currentAssigneeDisplayName} — selecione outro para alterar</span
							>
						{:else}
							<span in:fade={{ duration: prefersReducedMotion ? 0 : 150 }}>
								1 analista selecionado · <strong class="selected-name"
									>{selectedAnalyst.fullName}</strong
								>
							</span>
						{/if}
					{:else}
						<span class="muted">Nenhum analista selecionado</span>
					{/if}
				</span>
				<span class="footer-right">
					<Button
						variant="primary"
						disabled={selectedId === null || !responsibility || isSaving}
						loading={isSaving}
						onclick={handleSubmit}
					>
						{#if !isSaving}
							<Icon iconName="check" iconSize="sm" />
						{/if}
						Salvar
					</Button>
				</span>
			</div>
		</footer>
	</div>
</Modal>

<style>
	.assign-content {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.assign-subtitle {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 400;
		color: var(--gray);
		line-height: 1.4;
	}

	.protocol-highlight {
		color: var(--primary-color);
		font-weight: 700;
	}

	.current-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--primary-color) 12%, var(--surface));
		color: var(--primary-color);
		border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 500;
		line-height: 1.4;
	}

	.current-banner :global(.material-symbols-outlined) {
		color: var(--primary-color);
		flex-shrink: 0;
	}

	.banner-hint {
		color: var(--gray);
		font-weight: 400;
	}

	.filters-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.filter-field {
		min-width: 0;
	}

	.list-wrapper {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding-right: 4px;
		margin-right: -4px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		scrollbar-width: thin;
		scrollbar-color: var(--white-gray) transparent;
	}

	.list-wrapper::-webkit-scrollbar {
		width: 6px;
	}

	.list-wrapper::-webkit-scrollbar-thumb {
		background: var(--white-gray);
		border-radius: 999px;
	}

	.skeleton-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.skeleton-card {
		padding: 16px;
		border: 1px solid var(--white-gray);
		border-radius: 12px;
		background: var(--white);
		display: flex;
		flex-direction: column;
		gap: 10px;
		animation: shimmerIn 420ms ease both;
	}

	.skeleton-line {
		height: 12px;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			var(--white-gray) 25%,
			var(--white) 50%,
			var(--white-gray) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton-line.short {
		width: 42%;
		height: 14px;
	}

	.skeleton-line.tiny {
		width: 68%;
		height: 10px;
		opacity: 0.9;
	}

	.state-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 32px 16px;
		text-align: center;
		border: 1px dashed var(--white-gray);
		border-radius: 12px;
		background: var(--background-color);
	}

	.state-message p {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 600;
		color: var(--black);
	}

	.state-message.error p {
		color: var(--status-red);
	}

	.empty-hint {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.analyst-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.analyst-card {
		border: 1px solid var(--white-gray);
		border-radius: 12px;
		background: var(--white);
		transition:
			border-color 180ms ease,
			background-color 180ms ease,
			box-shadow 180ms ease,
			transform 180ms ease;
		overflow: hidden;
	}

	.analyst-card:hover {
		background: var(--background-color);
		border-color: var(--white-gray);
		transform: translateY(-1px);
		box-shadow: var(--regular-shadow);
	}

	.analyst-card.selected {
		border-color: var(--status-blue);
		background: var(--status-blue-bg);
		box-shadow: 0 2px 10px var(--status-blue-bg);
	}

	.analyst-card.selected:hover {
		background: var(--tint);
	}

	.card-main {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
		padding: 16px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.card-main:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 12px;
	}

	.card-left {
		flex-shrink: 0;
		padding-top: 2px;
		display: flex;
		align-items: flex-start;
	}

	.checkbox {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 1.5px solid var(--white-gray);
		background: var(--white);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			background 180ms ease,
			border-color 180ms ease;
		color: var(--white);
		line-height: 1;
		padding: 0;
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.checkbox.checked {
		background: var(--status-blue);
		border-color: var(--status-blue);
	}

	.check-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.check-mark :global(.material-symbols-outlined) {
		font-size: 14px;
		line-height: 1;
		display: block;
		color: var(--white);
	}

	.card-center {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.analyst-name {
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 700;
		color: var(--primary-color);
		line-height: 1.3;
		word-break: break-word;
	}

	.name-row {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.current-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 6px;
		border-radius: 999px;
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
		border: 1px solid var(--status-yellow);
		font-family: var(--font-inter);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1;
	}

	.analyst-specialty {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 400;
		color: var(--gray);
		line-height: 1.3;
	}

	.category-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 3px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--secondary-color) 12%, var(--surface));
		color: var(--secondary-color);
		border: 1px solid color-mix(in srgb, var(--secondary-color) 30%, transparent);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.notes-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;
		padding-top: 10px;
		border-top: 1px solid var(--white-gray);
	}

	.notes-label {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: var(--gray);
		text-transform: uppercase;
	}

	.notes-text {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 400;
		color: var(--black);
		line-height: 1.4;
		word-break: break-word;
	}

	.card-right {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: flex-start;
		min-width: 56px;
		padding-left: 8px;
	}

	.load-number {
		font-family: var(--font-montserrat);
		font-size: 20px;
		font-weight: 800;
		color: var(--primary-color);
		line-height: 1;
	}

	.load-label {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 500;
		color: var(--gray);
		line-height: 1;
		margin-top: 2px;
	}

	.submit-error {
		margin: 0;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		background: var(--status-red-bg);
		border: 1px solid var(--status-red);
		color: var(--status-red);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
	}

	.assign-footer {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 7px;
		margin-top: 4px;
		border-top: 1px solid var(--white-gray);
		background: var(--white);
		flex-shrink: 0;
	}

	.footer-group {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		padding: 8px 12px;
		padding-bottom: 12px;
		background: var(--background-color);
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.responsibility-group {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.deadline-field {
		align-items: center;
		display: flex;
		min-width: 160px;
		max-width: 200px;
		flex-shrink: 0;
	}

	.responsibility-title {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		color: var(--gray);
		letter-spacing: 0.02em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.radio-option {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		background: var(--white);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
		color: var(--black);
		cursor: pointer;
		transition: all 150ms ease;
		user-select: none;
	}

	.radio-option.selected {
		border-color: var(--secondary-color);
		background: var(--status-blue-bg);
		color: var(--primary-color);
		font-weight: 600;
	}

	.radio-option input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
	}

	.radio-indicator {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1.5px solid var(--gray);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 150ms ease;
		background: var(--white);
	}

	.radio-option.selected .radio-indicator {
		border-color: var(--secondary-color);
		background: var(--secondary-color);
		box-shadow: inset 0 0 0 3px var(--white);
	}

	.footer-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.footer-left {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 400;
		color: var(--gray);
		min-width: 0;
		flex: 1;
	}

	.footer-left .selected-name {
		color: var(--primary-color);
		font-weight: 700;
	}

	.footer-left .muted {
		color: var(--gray);
	}

	.footer-right {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@keyframes shimmerIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.filters-row {
			grid-template-columns: 1fr;
		}

		.footer-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.footer-right {
			justify-content: flex-end;
			width: 100%;
		}

		.responsibility-group {
			flex-direction: column;
			align-items: flex-start;
		}

		.deadline-field {
			max-width: none;
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.analyst-card,
		.checkbox,
		.skeleton-line {
			transition: none;
			animation: none;
		}
	}
</style>
