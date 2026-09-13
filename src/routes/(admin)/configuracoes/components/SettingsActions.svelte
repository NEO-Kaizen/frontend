<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		dirty: boolean;
		saving: boolean;
		invalid: boolean;
		feedback: string | null;
		feedbackType: 'success' | 'error' | null;
		onSave: () => void;
		onCancel: () => void;
		onRestoreDefaults: () => void;
	}

	let {
		dirty,
		saving,
		invalid,
		feedback,
		feedbackType,
		onSave,
		onCancel,
		onRestoreDefaults
	}: Props = $props();
</script>

<div class="settings-actions">
	{#if feedback}
		<p
			class="settings-feedback"
			class:success={feedbackType === 'success'}
			class:error={feedbackType === 'error'}
			role="status"
			aria-live="polite"
		>
			{feedback}
		</p>
	{/if}

	<div class="settings-buttons">
		<Button variant="outline-neutral" onclick={onRestoreDefaults} disabled={!dirty || saving}>
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
			Salvar alterações
		</Button>
	</div>
</div>

<style>
	.settings-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-md);
	}

	.settings-buttons {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}

	.settings-feedback {
		font: var(--paragrafo);
		font-size: 14px;
	}

	.settings-feedback.success {
		color: var(--status-green);
	}

	.settings-feedback.error {
		color: var(--status-red);
	}
</style>
