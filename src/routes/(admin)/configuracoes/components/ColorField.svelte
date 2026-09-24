<script lang="ts">
	import { onMount } from 'svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import { isValidHexColor } from '$lib/utils/validations';

	interface Props {
		label: string;
		value: string;
		onchange: (value: string) => void;
		// Exibe o slider de opacidade (alpha) — usado só onde a cor aceita alpha.
		allowAlpha?: boolean; // Texto auxiliar de uso, exibido sob o rótulo e ligado via aria-describedby.
		hint?: string;
		// Tooltip "i" ao lado do rótulo com a explicação de uso da cor.
		tooltip?: string;
		// Amostra "Aa": fundo (cor ou gradiente) + cor do texto.
		previewBackground?: string;
		previewForeground?: string;
		// Reserva a linha do hint mesmo sem texto, para alinhar campos no grid.
		reserveHint?: boolean;
		// Identificador estável para o pai agregar o estado de validade.
		fieldId?: string;
		onvaliditychange?: (id: string, invalid: boolean) => void;
		// Bloqueia edição (ex.: leitura autoritativa falhou) sem esconder valores.
		disabled?: boolean;
	}

	let {
		label,
		value,
		onchange,
		allowAlpha = false,
		hint,
		tooltip,
		previewBackground,
		previewForeground,
		reserveHint = false,
		fieldId,
		onvaliditychange,
		disabled = false
	}: Props = $props();

	// id estável entre SSR e cliente para o aria-describedby.
	const uid = $props.id();
	const hintId = `color-field-hint-${uid}`;
	const errorId = `color-field-error-${uid}`;
	const hasPreview = $derived(previewBackground !== undefined && previewForeground !== undefined);

	// Texto do erro de validação — estado visual (borda) e mensagem alinhados:
	// um hex incompleto/ inválido nunca é aceito no draft.
	const INVALID_COLOR_MESSAGE = 'Cor inválida. Informe um código hexadecimal válido.';

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

	// Descrição acessível: hint (uso do token) e erro de cor inválida podem
	// coexistir.
	const describedBy = $derived.by(() => {
		const ids: string[] = [];
		if (hint) ids.push(hintId);
		if (isInvalid) ids.push(errorId);
		return ids.length > 0 ? ids.join(' ') : undefined;
	});

	// Reporta a validade ao pai (ex.: agrega para bloquear o Salvar). Chamado
	// nos próprios handlers — sem `$effect`.
	function reportValidity(invalid: boolean): void {
		if (fieldId && onvaliditychange) onvaliditychange(fieldId, invalid);
	}

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
			reportValidity(false);
			return;
		}

		edited = next;
		reportValidity(true);
	}

	function handleColorInput(event: Event) {
		const rgb = (event.currentTarget as HTMLInputElement).value;
		const alpha = value.length === 9 ? value.slice(7) : '';
		edited = null;
		reportValidity(false);
		onchange(`${rgb}${alpha}`);
	}

	function handleAlphaInput(event: Event) {
		const percent = Number((event.currentTarget as HTMLInputElement).value);
		const alpha = Math.round((percent / 100) * 255);
		edited = null;
		reportValidity(false);
		onchange(alpha >= 255 ? rgbValue : `${rgbValue}${alpha.toString(16).padStart(2, '0')}`);
	}
</script>

<label class="color-field" class:invalid={isInvalid}>
	<span class="color-field-label">
		{label}
		{#if tooltip}
			<InfoTip label={`Informação sobre ${label}`} text={tooltip} />
		{/if}
	</span>
	{#if hint || reserveHint}
		<span
			class="color-field-hint"
			class:placeholder={!hint}
			id={hint ? hintId : undefined}
			aria-hidden={hint ? undefined : 'true'}
		>
			{hint ?? ''}
		</span>
	{/if}
	<span class="color-field-inputs">
		{#if isMounted}
			<input
				class="color-field-swatch"
				type="color"
				value={rgbValue}
				aria-label={`Selecionar cor de ${label}`}
				aria-describedby={describedBy}
				{disabled}
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
			aria-describedby={describedBy}
			{disabled}
			oninput={handleTextInput}
		/>
		{#if hasPreview}
			<span class="color-field-preview" style:background={previewBackground} aria-hidden="true">
				<span style:color={previewForeground}>Aa</span>
			</span>
		{/if}
	</span>
	{#if isInvalid}
		<span class="color-field-error" id={errorId} role="alert">{INVALID_COLOR_MESSAGE}</span>
	{/if}
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
		align-self: start;
	}

	.color-field-label {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-primary);
	}

	.color-field-hint {
		min-height: 1.3em;
		font-size: 12px;
		line-height: 1.3;
		color: var(--text-color-secondary);
	}

	.color-field-hint.placeholder {
		color: transparent;
		user-select: none;
	}

	.color-field-error {
		font-size: 12px;
		line-height: 1.3;
		color: var(--status-error);
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

	.color-field-preview {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		font: var(--label);
		font-size: 12px;
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
