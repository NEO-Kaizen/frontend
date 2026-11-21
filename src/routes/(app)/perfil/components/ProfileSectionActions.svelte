<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	interface Props {
		dirty: boolean;
		saving: boolean;
		invalid?: boolean;
		onSave: () => void;
		onCancel: () => void;
	}

	let { dirty, saving, invalid = false, onSave, onCancel }: Props = $props();
</script>

<div class="profile-section-actions">
	<Button variant="outline-neutral" onclick={onCancel} disabled={!dirty || saving}>Cancelar</Button>

	<Button
		variant="primary"
		onclick={onSave}
		loading={saving}
		disabled={!dirty || saving || invalid}
	>
		Salvar
	</Button>
</div>

<style>
	.profile-section-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}
</style>
