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
		// o ícone líder vira um "x" que reseta o filtro individualmente.
		clearValue?: string;
	}

	let {
		options,
		value,
		onchange,
		label = '',
		icon,
		ariaLabel,
		placeholder = 'Selecione',
		clearValue
	}: Props = $props();

	const uid = $props.id();
	const listId = `${uid}-listbox`;
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

<div class="filter-select" bind:this={container}>
	{#if isClearable}
		<button type="button" class="leading-action" aria-label={clearAriaLabel} onclick={clearFilter}>
			<Icon iconName="close" iconSize="md" />
		</button>
	{:else if icon}
		<Icon iconName={icon} iconSize="md" />
	{/if}

	{#if label}
		<span class="filter-label">{label}</span>
	{/if}

	<input
		type="text"
		role="combobox"
		aria-autocomplete="list"
		aria-expanded={open}
		aria-controls={listId}
		aria-activedescendant={open && filtered[highlighted] ? optionId(highlighted) : undefined}
		aria-label={ariaLabel ?? label}
		{placeholder}
		value={displayValue}
		bind:this={inputEl}
		onfocus={openList}
		oninput={handleInput}
		onkeydown={handleKeydown}
	/>

	<button
		type="button"
		class="caret"
		class:open
		tabindex="-1"
		aria-label="Abrir opções"
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

<style>
	.filter-select {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		width: 250px;
		min-width: 250px;
		padding: var(--spacing-sm);
		box-sizing: border-box;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.filter-select :global(.material-symbols-outlined) {
		flex-shrink: 0;
		color: var(--primary-color);
	}

	.filter-label {
		flex-shrink: 0;
		font: var(--paragrafo);
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

	.leading-action,
	.caret {
		display: inline-flex;
		flex-shrink: 0;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	.leading-action {
		color: var(--primary-color);
	}

	.leading-action:focus-visible,
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

	@media (max-width: 900px) {
		.filter-select {
			flex: 1 1 250px;
		}
	}

	@media (max-width: 560px) {
		.filter-select {
			width: 100%;
			min-width: 0;
			flex-basis: auto;
		}
	}
</style>
