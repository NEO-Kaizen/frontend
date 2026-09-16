<script lang="ts">
	import { onDestroy } from 'svelte';
	import { listUsers } from '$lib/services/user.service';
	import type { AdminUser } from '$lib/types/user';
	import Icon from './Icon.svelte';

	// Selecionados: subconjunto estrutural de `AdminUser` (id/nome/e-mail) —
	// nenhuma estrutura paralela de usuário. A busca retorna `AdminUser` direto.
	interface Props {
		label?: string;
		placeholder?: string;
		selected: Pick<AdminUser, 'id' | 'name' | 'email'>[];
		onSelect?: (user: AdminUser) => void;
		onRemove?: (id: string) => void;
		disabled?: boolean;
		// Somente leitura: exibe apenas os chips, sem busca nem remoção
		// (mesmo padrão de visualização do `Field` em modo leitura).
		readonly?: boolean;
	}

	let {
		label = 'Participantes',
		placeholder = 'Buscar por nome ou e-mail...',
		selected,
		onSelect,
		onRemove,
		disabled = false,
		readonly = false
	}: Props = $props();

	// Mesmos parâmetros da busca de usuários da tela administrativa.
	const MIN_SEARCH_LENGTH = 2;
	const SEARCH_DEBOUNCE_MS = 350;
	const SEARCH_PAGE_SIZE = 8;

	const uid = $props.id();
	const listId = `${uid}-listbox`;
	const inputId = `${uid}-input`;
	const optionId = (index: number) => `${uid}-option-${index}`;

	let term = $state('');
	let results = $state<AdminUser[]>([]);
	let isSearching = $state(false);
	let searchError = $state<string | null>(null);
	let open = $state(false);
	let highlighted = $state(0);
	let container = $state<HTMLDivElement>();
	let listbox = $state<HTMLUListElement>();
	let inputEl = $state<HTMLInputElement>();
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let lastRequestId = 0;

	const selectedIds = $derived(new Set(selected.map((item) => item.id)));
	const available = $derived(results.filter((user) => !selectedIds.has(user.id)));
	const showHint = $derived(term.trim().length > 0 && term.trim().length < MIN_SEARCH_LENGTH);

	onDestroy(() => {
		if (searchTimer !== undefined) clearTimeout(searchTimer);
	});

	$effect(() => {
		if (!open) return;
		listbox?.children[highlighted]?.scrollIntoView({ block: 'nearest' });
	});

	function getInitials(name: string): string {
		const parts = name
			.replace(/[_.-]+/g, ' ')
			.split(' ')
			.filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
		return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
	}

	async function runSearch(query: string, requestId: number): Promise<void> {
		isSearching = true;
		searchError = null;
		open = true;
		const result = await listUsers({ search: query, pageSize: SEARCH_PAGE_SIZE });
		// Resposta obsoleta: a busca mais recente é dona dos estados
		// (`isSearching`, `open`, `results`) e vai concluí-los; aqui nada se muta.
		if (requestId !== lastRequestId) return;
		isSearching = false;
		if (result.ok) {
			results = result.data.data;
			highlighted = 0;
		} else {
			results = [];
			searchError = result.error.message;
		}
	}

	function scheduleSearch(value: string): void {
		if (searchTimer !== undefined) clearTimeout(searchTimer);
		const query = value.trim();
		if (query.length < MIN_SEARCH_LENGTH) {
			results = [];
			searchError = null;
			isSearching = false;
			open = false;
			return;
		}
		searchTimer = setTimeout(() => {
			lastRequestId += 1;
			void runSearch(query, lastRequestId);
		}, SEARCH_DEBOUNCE_MS);
	}

	function closeList(): void {
		open = false;
	}

	function selectUser(user: AdminUser): void {
		if (disabled) return;
		onSelect?.(user);
		term = '';
		results = [];
		searchError = null;
		closeList();
		inputEl?.focus();
	}

	function retrySearch(): void {
		if (disabled) return;
		const query = term.trim();
		if (query.length < MIN_SEARCH_LENGTH) return;
		lastRequestId += 1;
		void runSearch(query, lastRequestId);
		inputEl?.focus();
	}

	function handleInput(event: Event): void {
		term = (event.currentTarget as HTMLInputElement).value;
		scheduleSearch(term);
	}

	function handleKeydown(event: KeyboardEvent): void {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (!open) {
					if (available.length > 0) open = true;
					return;
				}
				if (available.length > 0) {
					highlighted = Math.min(highlighted + 1, available.length - 1);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (open && available.length > 0) {
					highlighted = Math.max(highlighted - 1, 0);
				}
				break;
			case 'Home':
				if (open && available.length > 0) {
					event.preventDefault();
					highlighted = 0;
				}
				break;
			case 'End':
				if (open && available.length > 0) {
					event.preventDefault();
					highlighted = available.length - 1;
				}
				break;
			case 'Enter':
				if (open && available[highlighted]) {
					event.preventDefault();
					selectUser(available[highlighted]);
				}
				break;
			case 'Escape':
				if (open) {
					event.preventDefault();
					closeList();
				}
				break;
			case 'Tab':
				closeList();
				break;
		}
	}

	function handleOutside(event: PointerEvent): void {
		if (open && container && !container.contains(event.target as Node)) {
			closeList();
		}
	}

	function handleFocusOut(event: FocusEvent): void {
		const related = event.relatedTarget as Node | null;
		const editor = event.currentTarget as HTMLElement;
		if (related && editor.contains(related)) return;
		closeList();
	}
</script>

<svelte:window onpointerdown={handleOutside} />

<div class="user-multi-select">
	{#if readonly}
		<span class="readonly-label" id={`${uid}-label`}>{label}</span>
		{#if selected.length === 0}
			<p class="fallback-text">Nenhum participante incluído.</p>
		{:else}
			<ul class="chip-list" aria-labelledby={`${uid}-label`}>
				{#each selected as user (user.id)}
					<li class="chip">
						<span class="chip-initials" aria-hidden="true">{getInitials(user.name)}</span>
						<span class="chip-text">
							<span class="chip-name">{user.name}</span>
							<span class="chip-email">{user.email}</span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<label for={inputId}>{label}</label>

		<div class="control" class:disabled bind:this={container} onfocusout={handleFocusOut}>
			<span class="leading-icon" aria-hidden="true">
				<Icon iconName="search" iconSize="md" />
			</span>

			<input
				id={inputId}
				type="text"
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={open}
				aria-controls={listId}
				aria-activedescendant={open && available[highlighted] ? optionId(highlighted) : undefined}
				{placeholder}
				{disabled}
				value={term}
				bind:this={inputEl}
				oninput={handleInput}
				onkeydown={handleKeydown}
				autocomplete="off"
			/>

			{#if isSearching}
				<span class="spinner" aria-hidden="true"></span>
			{/if}

			{#if open}
				<ul class="options" id={listId} role="listbox" bind:this={listbox}>
					{#if isSearching}
						<li class="status" role="presentation">
							<span role="status">Buscando usuários…</span>
						</li>
					{:else if searchError}
						<li class="status" role="presentation">
							<span role="alert">{searchError}</span>
							<button type="button" class="retry" {disabled} onclick={retrySearch}>
								Tentar novamente
							</button>
						</li>
					{:else if available.length === 0}
						<li class="status" role="presentation">
							<span role="status">Nenhum usuário encontrado para “{term.trim()}”.</span>
						</li>
					{:else}
						{#each available as user, index (user.id)}
							<!-- Padrão ARIA listbox: as opções não recebem foco; a navegação por teclado fica no input combobox. -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<li
								id={optionId(index)}
								role="option"
								aria-selected={index === highlighted}
								class:highlighted={index === highlighted}
								onmousedown={(event) => event.preventDefault()}
								onclick={() => selectUser(user)}
							>
								<span class="option-name">{user.name}</span>
								<span class="option-email">{user.email}</span>
							</li>
						{/each}
					{/if}
				</ul>
			{/if}
		</div>

		{#if showHint}
			<p class="hint">Digite ao menos {MIN_SEARCH_LENGTH} caracteres para buscar.</p>
		{/if}

		{#if selected.length > 0}
			<p class="selected-title" id={`${uid}-selected`}>Participantes selecionados:</p>
			<ul class="chip-list" aria-labelledby={`${uid}-selected`}>
				{#each selected as user (user.id)}
					<li class="chip">
						<span class="chip-initials" aria-hidden="true">{getInitials(user.name)}</span>
						<span class="chip-text">
							<span class="chip-name">{user.name}</span>
							<span class="chip-email">{user.email}</span>
						</span>
						<button
							type="button"
							class="chip-remove"
							aria-label={`Remover ${user.name}`}
							{disabled}
							onclick={() => onRemove?.(user.id)}
						>
							<Icon iconName="close" iconSize="sm" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.user-multi-select {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
		min-width: 0;
	}

	label,
	.readonly-label {
		font: var(--label);
		color: var(--black);
	}

	.readonly-label {
		display: block;
	}

	.control {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		box-sizing: border-box;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		transition: var(--transition-default);
	}

	.control:focus-within {
		border-color: var(--primary-color);
	}

	.control :global(.material-symbols-outlined) {
		flex-shrink: 0;
		color: var(--primary-color);
	}

	.leading-icon {
		display: inline-flex;
		pointer-events: none;
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		background-color: transparent;
		color: var(--rich-black);
		font: var(--paragrafo);
		outline: none;
	}

	input::placeholder {
		color: var(--gray);
	}

	input:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.control.disabled {
		opacity: 0.6;
	}

	.control.disabled input {
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		border: 2px solid var(--white-gray);
		border-right-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.options {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 20;
		max-height: 240px;
		margin: 0;
		padding: var(--spacing-xs);
		overflow-y: auto;
		list-style: none;
		background-color: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
	}

	.options li:not(.status) {
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.options li.highlighted {
		background-color: rgba(0, 51, 153, 0.08);
	}

	.option-name {
		display: block;
		font: var(--paragrafo);
		color: var(--rich-black);
	}

	.options li.highlighted .option-name {
		color: var(--primary-color);
		font-weight: 600;
	}

	.option-email {
		display: block;
		font: var(--label);
		color: var(--gray);
	}

	.status {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		align-items: flex-start;
		font: var(--paragrafo);
		color: var(--gray);
		cursor: default;
	}

	.retry {
		padding: 0;
		border: none;
		background: none;
		font: var(--label);
		font-weight: 600;
		color: var(--secondary-color);
		cursor: pointer;
	}

	.retry:hover {
		text-decoration: underline;
	}

	.retry:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.hint,
	.fallback-text {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--gray);
	}

	.selected-title {
		margin: var(--spacing-sm) 0 0 0;
		font: var(--label);
		color: var(--black);
	}

	.chip-list {
		list-style: none;
		margin: 0;
		padding: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		background: #fafafa;
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px 6px 6px;
		background: var(--white);
		border: 1px solid var(--white-gray);
		border-radius: 999px;
		max-width: 100%;
	}

	.chip-initials {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		height: 28px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--background-color);
		color: var(--primary-color);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.chip-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.chip-name {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--black);
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.chip-email {
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.chip-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		border: none;
		border-radius: 999px;
		background: none;
		color: var(--gray);
		cursor: pointer;
		flex-shrink: 0;
	}

	.chip-remove:hover:not(:disabled) {
		color: var(--status-red);
	}

	.chip-remove:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 1px;
	}

	.chip-remove:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.user-multi-select:focus-within {
		position: relative;
		z-index: 30;
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
