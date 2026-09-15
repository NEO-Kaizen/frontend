<script lang="ts">
	import { onMount } from 'svelte';
	import { isValidHexColor } from '$lib/utils/validations';

	interface Props {
		label: string;
		value: string;
		onchange: (value: string) => void;
		// Exibe o slider de opacidade (alpha) — usado só onde a cor aceita alpha.
		allowAlpha?: boolean;
	}

	let { label, value, onchange, allowAlpha = false }: Props = $props();

	// O `<input type="color">` só é criado após o mount: a hidratação do Svelte
	// remove o atributo `value` desses inputs (tratamento de reset de formulário)
	// e o Chrome emite um warning de formato para `value=""`. No SSR/hidratação
	// um swatch não interativo o substitui, com a mesma aparência.
	let isMounted = $state(false);
	onMount(() => {
		isMounted = true;
	});

	// `edited` guarda o texto digitado enquanto ele ainda não forma um hex
	// válido; ao commitar um valor válido ele é limpo e o campo volta a
	// seguir `value` (auto-sugestão, restaurar padrão). Evita `$effect`.
	let edited = $state<string | null>(null);
	const text = $derived(edited ?? value);
	const isInvalid = $derived(edited !== null);

	// O input nativo de cor só aceita #RRGGBB — o alpha (quando existe) é
	// preservado ao trocar a cor de base.
	const rgbValue = $derived(/^#[0-9a-fA-F]{6}/.test(value) ? value.slice(0, 7) : '#000000');

	// Alpha em % lido do `#RRGGBBAA` (6 dígitos = opaco).
	const alphaPercent = $derived(
		value.length === 9 ? Math.round((parseInt(value.slice(7, 9), 16) / 255) * 100) : 100
	);

	function handleTextInput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement).value;

		if (isValidHexColor(next)) {
			onchange(next);
			edited = null;
			return;
		}

		edited = next;
	}

	function handleColorInput(event: Event) {
		const rgb = (event.currentTarget as HTMLInputElement).value;
		const alpha = value.length === 9 ? value.slice(7) : '';
		edited = null;
		onchange(`${rgb}${alpha}`);
	}

	function handleAlphaInput(event: Event) {
		const percent = Number((event.currentTarget as HTMLInputElement).value);
		const alpha = Math.round((percent / 100) * 255);
		edited = null;
		onchange(alpha >= 255 ? rgbValue : `${rgbValue}${alpha.toString(16).padStart(2, '0')}`);
	}
</script>

<label class="color-field" class:invalid={isInvalid}>
	<span class="color-field-label">{label}</span>
	<span class="color-field-inputs">
		{#if isMounted}
			<input
				class="color-field-swatch"
				type="color"
				value={rgbValue}
				aria-label={`Selecionar cor de ${label}`}
				oninput={handleColorInput}
			/>
		{:else}
			<span
				class="color-field-swatch color-field-swatch-preview"
				style:background-color={rgbValue}
				aria-hidden="true"
			></span>
		{/if}
		<input
			class="color-field-hex"
			type="text"
			value={text}
			maxlength={9}
			spellcheck="false"
			aria-label={`Código hexadecimal de ${label}`}
			aria-invalid={isInvalid}
			oninput={handleTextInput}
		/>
	</span>
	{#if allowAlpha}
		<span class="color-field-alpha">
			<input
				class="color-field-alpha-range"
				type="range"
				min="0"
				max="100"
				step="1"
				value={alphaPercent}
				aria-label={`Opacidade de ${label}`}
				oninput={handleAlphaInput}
			/>
			<span class="color-field-alpha-value">{alphaPercent}%</span>
		</span>
	{/if}
</label>

<style>
	.color-field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		min-width: 0;
	}

	.color-field-label {
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-secondary);
	}

	.color-field-inputs {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.color-field-swatch {
		display: block;
		width: 32px;
		height: 32px;
		padding: 2px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		cursor: pointer;
		flex-shrink: 0;
	}

	.color-field-swatch-preview {
		cursor: default;
	}

	.color-field-hex {
		width: 100%;
		min-width: 0;
		height: 32px;
		padding: 0 var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		color: var(--text-color-primary);
		font: var(--label);
		font-size: 13px;
		text-transform: lowercase;
	}

	.color-field.invalid .color-field-hex {
		border-color: var(--status-error);
	}

	.color-field-alpha {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.color-field-alpha-range {
		width: 100%;
		min-width: 0;
		accent-color: var(--primary-color);
		cursor: pointer;
	}

	.color-field-alpha-value {
		font-size: 12px;
		color: var(--text-color-secondary);
		min-width: 34px;
		text-align: end;
	}
</style>
