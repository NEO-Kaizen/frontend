<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		disabled?: boolean;
		onfill: () => void;
	}

	let { disabled = false, onfill }: Props = $props();
</script>

<Button variant="outline-neutral" {disabled} onclick={onfill}>
	<Icon iconName="autorenew" iconSize="md" />
	Preencher exemplo
</Button>
