<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from '$lib/types/icons';

	export type FilterOption = {
		value: string;
		label: string;
	};

	interface Props {
		options: FilterOption[];
		value: string;
		onchange: (value: string) => void;
		label?: string;
		icon?: IconName;
		ariaLabel?: string;
		placeholder?: string;
		// Valor considerado "sem filtro". Quando definido e o valor atual difere,
		// um "x" à direita reseta o filtro individualmente.
		clearValue?: string;
		error?: string;
		disabled?: boolean;
		dirty?: boolean;
	}

	let {
		options,
		value,
		onchange,
		label = '',
		icon,
		ariaLabel,
		placeholder = 'Selecione',
		clearValue,
		error = '',
		disabled = false,
		dirty = false
	}: Props = $props();

	const uid = $props.id();
	const listId = `${uid}-listbox`;
	const inputId = `${uid}-input`;
	const optionId = (index: number) => `${uid}-option-${index}`;

	let open = $state(false);
	let query = $state('');
	let highlighted = $state(0);
	let container = $state<HTMLDivElement>();
	let listbox = $state<HTMLUListElement>();
	let inputEl = $state<HTMLInputElement>();

	// Busca acento-insensível: "média" casa com "Media" e vice-versa.
	function normalize(text: string): string {
		return text
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase()
			.trim();
	}

	const selectedLabel = $derived(
		options.find((option) => option.value === value)?.label ?? placeholder
	);

	const filtered = $derived.by(() => {
		const term = normalize(query);

		if (!term) return options;

		return options.filter((option) => normalize(option.label).includes(term));
	});

	// Aberto, o input mostra o termo digitado; fechado, mostra o rótulo selecionado.
	const displayValue = $derived(open ? query : selectedLabel);

	const isClearable = $derived(clearValue !== undefined && value !== clearValue);

	const clearAriaLabel = $derived(
		`Limpar filtro de ${(label || ariaLabel || '').replace(/:$/, '')}`
	);

	$effect(() => {
		if (!open) return;

		listbox?.children[highlighted]?.scrollIntoView({ block: 'nearest' });
	});

	function openList() {
		query = '';
		const index = options.findIndex((option) => option.value === value);

		highlighted = index >= 0 ? index : 0;
		open = true;
	}

	function closeList() {
		open = false;
		query = '';
	}

	function toggleOpen() {
		if (open) {
			closeList();
			inputEl?.blur();
			return;
		}

		openList();
		inputEl?.focus();
	}

	function clearFilter() {
		if (clearValue === undefined) return;

		onchange(clearValue);
		closeList();
		inputEl?.blur();
	}

	function selectOption(option: FilterOption) {
		onchange(option.value);
		closeList();
	}

	function handleInput(event: Event) {
		open = true;
		query = (event.currentTarget as HTMLInputElement).value;
		highlighted = 0;
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (!open) {
					openList();
					return;
				}
				if (filtered.length > 0) {
					highlighted = Math.min(highlighted + 1, filtered.length - 1);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (!open) {
					openList();
					return;
				}
				if (filtered.length > 0) {
					highlighted = Math.max(highlighted - 1, 0);
				}
				break;
			case 'Enter':
				if (open && filtered[highlighted]) {
					event.preventDefault();
					selectOption(filtered[highlighted]);
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

	function handleOutside(event: PointerEvent) {
		if (open && container && !container.contains(event.target as Node)) {
			closeList();
		}
	}
</script>

<svelte:window onpointerdown={handleOutside} />

<div class="filter-select">
	{#if label}
		<label for={inputId}>{label}</label>
	{/if}

	<div
		class="control"
		class:error={Boolean(error)}
		class:dirty
		class:disabled
		bind:this={container}
	>
		{#if icon}
			<Icon iconName={icon} iconSize="md" />
		{/if}

		<input
			id={inputId}
			type="text"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-controls={listId}
			aria-activedescendant={open && filtered[highlighted] ? optionId(highlighted) : undefined}
			aria-label={ariaLabel ?? label}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${inputId}-error` : undefined}
			{placeholder}
			{disabled}
			value={displayValue}
			bind:this={inputEl}
			onfocus={openList}
			oninput={handleInput}
			onkeydown={handleKeydown}
		/>

		{#if isClearable}
			<button
				type="button"
				class="trailing-action"
				aria-label={clearAriaLabel}
				{disabled}
				onclick={clearFilter}
			>
				<Icon iconName="close" iconSize="md" />
			</button>
		{/if}

		<button
			type="button"
			class="caret"
			class:open
			tabindex="-1"
			aria-label="Abrir opções"
			{disabled}
			onmousedown={(event) => event.preventDefault()}
			onclick={toggleOpen}
		>
			<Icon iconName="expandMore" iconSize="md" />
		</button>

		{#if open}
			<ul class="options" id={listId} role="listbox" bind:this={listbox}>
				{#if filtered.length === 0}
					<li class="empty" role="presentation">Nenhum resultado</li>
				{:else}
					{#each filtered as option, index (option.value)}
						<!-- Padrão ARIA listbox: as opções não recebem foco; a navegação por teclado fica no input combobox. -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<li
							id={optionId(index)}
							role="option"
							aria-selected={option.value === value}
							class:highlighted={index === highlighted}
							onclick={() => {
								selectOption(option);
								inputEl?.blur();
							}}
						>
							{option.label}
						</li>
					{/each}
				{/if}
			</ul>
		{/if}
	</div>

	{#if error}
		<p id={`${inputId}-error`} class="error-message">
			{error}
		</p>
	{/if}
</div>

<style>
	.filter-select {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
		min-width: 0;
	}

	label {
		font: var(--label);
		color: var(--black);
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

	input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		background-color: transparent;
		color: var(--rich-black);
		font: var(--paragrafo);
		outline: none;
		cursor: pointer;
	}

	input::placeholder {
		color: var(--gray);
	}

	input:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.trailing-action,
	.caret {
		display: inline-flex;
		flex-shrink: 0;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	.trailing-action {
		color: var(--primary-color);
	}

	.trailing-action:focus-visible,
	.caret:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.caret {
		color: var(--gray);
		transform-origin: center;
		transition: transform var(--transition-default);
	}

	.caret :global(.material-symbols-outlined) {
		color: var(--gray);
	}

	.caret.open {
		transform: rotate(180deg);
	}

	.control.dirty {
		border-color: var(--secondary-color);
	}

	.control.error {
		border-color: var(--status-red);
	}

	.control.error:focus-within {
		border-color: var(--status-red);
	}

	.control.disabled {
		opacity: 0.6;
	}

	.control.disabled input,
	.control.disabled .trailing-action,
	.control.disabled .caret {
		cursor: not-allowed;
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

	.options li {
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		font: var(--paragrafo);
		color: var(--rich-black);
		cursor: pointer;
	}

	.options li.highlighted {
		background-color: rgba(0, 51, 153, 0.08);
	}

	.options li[aria-selected='true'] {
		color: var(--primary-color);
		font-weight: 600;
	}

	.options .empty {
		color: var(--gray);
		cursor: default;
	}

	.error-message {
		margin: 0;
		margin-top: 2px;
		color: var(--status-red);
		font: var(--label);
	}

	.filter-select:focus-within {
		position: relative;
		z-index: 30;
	}
</style>
