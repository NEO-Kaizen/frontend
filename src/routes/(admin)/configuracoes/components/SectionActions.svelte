<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { notifyInfo } from '$lib/utils/feedback';

	interface Props {
		dirty: boolean;
		saving: boolean;
		// O draft difere dos defaults do portal (habilita "Restaurar padrão"
		// mesmo sem alteração local).
		restorable: boolean;
		invalid?: boolean;
		// Leitura autoritativa falhou: a configuração em tela pode ser o fallback
		// local — Salvar/Restaurar ficam bloqueados até a revalidação.
		loadFailed?: boolean;
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
		loadFailed = false,
		onSave,
		onCancel,
		onRestoreDefaults,
		confirmDescription = 'Os valores padrão do portal serão aplicados ao rascunho desta seção. A restauração só é efetivada ao clicar em Salvar.'
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
			disabled={!restorable || saving || loadFailed}
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
			disabled={!dirty || saving || invalid || loadFailed}
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
		notifyInfo(
			'Valores padrão aplicados ao rascunho. Clique em Salvar para efetivar a restauração.'
		);
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
