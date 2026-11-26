<script lang="ts">
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	// Botão de exportação em PDF — apresentacional de propósito: não conhece o
	// service, o endpoint nem o blob. Quem o usa decide o que `onExport` faz.
	// Assim a interface pode ser entregue antes da integração com o backend.
	interface Props {
		loading?: boolean;
		disabled?: boolean;
		compactProtocol?: string;
		onExport: () => void;
	}

	let { loading = false, disabled = false, compactProtocol, onExport }: Props = $props();
</script>

<Button
	variant="outline"
	{loading}
	{disabled}
	class={compactProtocol ? 'pdf-icon-action' : undefined}
	title={compactProtocol ? 'Exportar PDF' : undefined}
	aria-label={compactProtocol ? `Exportar PDF de ${compactProtocol}` : undefined}
	onclick={onExport}
>
	{#if !loading}
		<Icon iconName="download" iconSize="sm" />
	{/if}
	{#if !compactProtocol}
		<span>{loading ? 'Gerando PDF…' : 'Exportar PDF'}</span>
	{/if}
</Button>

<style>
	:global(button.pdf-icon-action) {
		width: 32px;
		height: 32px;
		padding: 0;
		flex: none;
	}
</style>
