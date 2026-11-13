<script lang="ts">
	import Icon from './Icon.svelte';
	import Input from './Input.svelte';

	// Entrada de lista de marcadores (badges) genérica: digite e confirme com
	// Enter ou com o botão "+". Não conhece regra de negócio — validação de
	// conteúdo e feedback de duplicidade ficam com quem usa o componente.
	interface Props {
		label?: string;
		placeholder?: string;
		hint?: string;
		value?: string[];
		error?: string;
		disabled?: boolean;
		required?: boolean;
		maxlength?: number;
		id?: string;
		// Chamado para cada item já existente (comparação sem diferenciar
		// maiúsculas). Sem handler, a duplicata é descartada em silêncio.
		onDuplicate?: (value: string) => void;
	}

	let {
		label = '',
		placeholder = '',
		hint = '',
		value = $bindable([]),
		error = '',
		disabled = false,
		required = false,
		maxlength,
		id,
		onDuplicate
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? uid);
	const listId = `${uid}-list`;

	let term = $state('');

	function normalize(item: string): string {
		return item.trim().toLowerCase();
	}

	function addTerm() {
		// Aceita vírgula como separador para colar valores no formato antigo.
		const candidates = term
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);

		if (candidates.length === 0) return;

		const next = [...value];

		for (const candidate of candidates) {
			const key = normalize(candidate);

			if (next.some((item) => normalize(item) === key)) {
				onDuplicate?.(candidate);
				continue;
			}

			next.push(candidate);
		}

		value = next;
		term = '';
	}

	function removeAt(index: number) {
		value = value.filter((_, current) => current !== index);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTerm();
			return;
		}

		if (event.key === 'Backspace' && term === '' && value.length > 0) {
			value = value.slice(0, -1);
		}
	}
</script>

<div class="tag-input">
	<Input
		{label}
		{hint}
		id={inputId}
		{placeholder}
		bind:value={term}
		{disabled}
		{required}
		{maxlength}
		{error}
		leadingActionIcon="addCircle"
		leadingActionLabel="Adicionar"
		onLeadingAction={addTerm}
		onkeydown={handleKeydown}
		autocomplete="off"
	/>

	{#if value.length > 0}
		<ul class="chip-list" id={listId} aria-live="polite">
			{#each value as item, index (item)}
				<li class="chip">
					<span class="chip-text">{item}</span>
					<button
						type="button"
						class="chip-remove"
						{disabled}
						aria-label={`Remover ${item}`}
						onclick={() => removeAt(index)}
					>
						<Icon iconName="close" iconSize="sm" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.tag-input {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.chip-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		max-width: 100%;
		padding: 6px 6px 6px 12px;
		border: var(--border-default);
		border-radius: 999px;
		background: var(--white);
	}

	.chip-text {
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--black);
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
		transition: var(--transition-default);
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
</style>
