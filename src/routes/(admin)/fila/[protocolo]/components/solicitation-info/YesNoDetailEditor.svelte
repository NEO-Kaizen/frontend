<script lang="ts">
	import { YES_NO_OPTIONS, type YesNoDetail } from '$lib/types/request';
	import { toChoice } from './edit-validation';
	import Field from './Field.svelte';

	// Par escolha + detalhe (`YesNoDetail`) reutilizado pelos 5 campos do tipo
	// (1 operacional obrigatório + 4 complementares opcionais).
	interface Props {
		label: string;
		display: string;
		value?: YesNoDetail | null;
		isEditMode?: boolean;
		optional?: boolean;
		detailLabel?: string;
		choiceError?: string;
		detailError?: string;
		choiceDirty?: boolean;
		detailDirty?: boolean;
		onChoiceInput?: (value: string) => void;
		onDetailInput?: (value: string) => void;
		onChoiceBlur?: () => void;
		onDetailBlur?: () => void;
	}

	let {
		label,
		display,
		value,
		isEditMode = false,
		optional = false,
		detailLabel = `Detalhe — ${label}`,
		choiceError = '',
		detailError = '',
		choiceDirty = false,
		detailDirty = false,
		onChoiceInput,
		onDetailInput,
		onChoiceBlur,
		onDetailBlur
	}: Props = $props();

	let choice = $derived(toChoice(value ?? undefined));
	let detail = $derived(typeof value === 'string' ? value : '');
</script>

{#if isEditMode}
	<div class="yesno-editor">
		<Field
			{label}
			kind="select"
			isEditMode
			options={YES_NO_OPTIONS}
			editValue={choice}
			allowEmpty={optional}
			error={choiceError}
			dirty={choiceDirty}
			onEditInput={(next) => onChoiceInput?.(next)}
			onEditBlur={onChoiceBlur}
		/>
		<Field
			label={detailLabel}
			kind="text"
			isEditMode
			editValue={detail}
			disabled={choice !== 'Sim'}
			maxlength={1000}
			error={detailError}
			dirty={detailDirty}
			onEditInput={(next) => onDetailInput?.(next)}
			onEditBlur={onDetailBlur}
		/>
	</div>
{:else}
	<Field {label} value={display} />
{/if}

<style>
	/* Conteúdos fluem como células do grid pai (mesmo padrão do formulário). */
	.yesno-editor {
		display: contents;
	}
</style>
