<script lang="ts">
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	// Botão de exportação em PDF — apresentacional de propósito: não conhece o
	// service, o endpoint nem o blob. Quem o usa decide o que `onExport` faz.
	// Assim a interface pode ser entregue antes da integração com o backend.
	interface Props {
		loading?: boolean;
		disabled?: boolean;
		onExport: () => void;
	}

	let { loading = false, disabled = false, onExport }: Props = $props();
</script>

<Button variant="outline" {loading} {disabled} onclick={onExport}>
	{#if !loading}
		<Icon iconName="download" iconSize="sm" />
	{/if}
	<span>{loading ? 'Gerando PDF…' : 'Exportar PDF'}</span>
</Button>
