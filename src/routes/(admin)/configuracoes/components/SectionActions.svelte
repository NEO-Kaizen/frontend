<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { SectionFeedback } from '$lib/states/section.svelte';

	interface Props {
		dirty: boolean;
		saving: boolean;
		invalid?: boolean;
		feedback: SectionFeedback | null;
		onSave: () => void;
		onCancel: () => void;
		onRestoreDefaults: () => void;
		confirmDescription?: string;
	}

	let {
		dirty,
		saving,
		invalid = false,
		feedback,
		onSave,
		onCancel,
		onRestoreDefaults,
		confirmDescription = 'Esta ação substitui os valores atuais desta seção pelos valores padrão do portal.'
	}: Props = $props();

	// O diálogo de confirmação do "Restaurar padrão" é local ao card — cada
	// seção restaura apenas a sua fatia.
	let confirmRestore = $state(false);
</script>

<div class="section-actions">
	{#if feedback}
		<p
			class="section-feedback"
			class:success={feedback.type === 'success'}
			class:error={feedback.type === 'error'}
			role="status"
			aria-live="polite"
		>
			{feedback.message}
		</p>
	{/if}

	<div class="section-buttons">
		<Button
			variant="outline-neutral"
			onclick={() => (confirmRestore = true)}
			disabled={!dirty || saving}
		>
			<Icon iconName="autorenew" iconSize="sm" />
			Restaurar padrão
		</Button>
		<Button variant="outline-neutral" onclick={onCancel} disabled={!dirty || saving}>
			Cancelar
		</Button>
		<Button
			variant="primary"
			onclick={onSave}
			loading={saving}
			disabled={!dirty || saving || invalid}
		>
			Salvar
		</Button>
	</div>
</div>

<ConfirmDialog
	open={confirmRestore}
	title="Restaurar valores padrão?"
	description={confirmDescription}
	confirmLabel="Restaurar"
	cancelLabel="Cancelar"
	onConfirm={() => {
		onRestoreDefaults();
		confirmRestore = false;
	}}
	onClose={() => (confirmRestore = false)}
/>

<style>
	.section-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-md);
	}

	.section-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}

	.section-feedback {
		font: var(--paragrafo);
		font-size: 14px;
	}

	.section-feedback.success {
		color: var(--status-green);
	}

	.section-feedback.error {
		color: var(--status-red);
	}
</style>
