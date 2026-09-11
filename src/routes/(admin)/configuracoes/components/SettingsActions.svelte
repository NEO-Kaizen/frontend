<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
</script>

<div class="settings-actions">
	<Button variant="outline-neutral">
		<Icon iconName="autorenew" iconSize="sm" />
		Restaurar padrão
	</Button>
	<Button variant="outline-neutral">Cancelar</Button>
	<Button variant="primary">Salvar alterações</Button>
</div>

<style>
	.settings-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}
</style>
