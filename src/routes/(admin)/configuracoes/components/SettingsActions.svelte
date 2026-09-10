<script lang="ts">
	import Button from '$lib/components/Button.svelte';
</script>

<div class="settings-actions">
	<Button variant="outline-neutral">Restaurar padrão</Button>
	<Button variant="outline">Cancelar</Button>
	<Button variant="primary">Salvar alterações</Button>
</div>

<style>
	.settings-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}
</style>
