<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		dirty: boolean;
		saving: boolean;
		// O draft difere dos defaults do portal (habilita "Restaurar padrão"
		// mesmo sem alteração local).
		restorable: boolean;
		invalid?: boolean;
		onSave: () => void;
		onCancel: () => void;
		onRestoreDefaults: () => void;
		confirmDescription?: string;
	}

	let {
		dirty,
		saving,
		restorable,
		invalid = false,
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
	<div class="section-buttons">
		<Button
			variant="outline-neutral"
			onclick={() => (confirmRestore = true)}
			disabled={!restorable || saving}
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
</style>
