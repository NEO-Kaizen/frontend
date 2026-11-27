<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { toastState } from '$lib/states/toast.svelte';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();
	let isApplying = $state(false);

	async function handleApplyExample(): Promise<void> {
		if (isApplying) return;

		isApplying = true;

		try {
			const { applyNeoExample } = await import('$lib/config/neo-example.service');
			const result = await applyNeoExample();

			toastState.add(result.message, result.ok ? 'success' : 'error');
			isApplying = false;

			if (result.ok) {
				await invalidateAll();
			}
		} catch {
			isApplying = false;
			toastState.add('Não foi possível aplicar o exemplo.', 'error');
		}
	}
</script>

<Button
	variant="outline-neutral"
	onclick={handleApplyExample}
	loading={isApplying}
	{disabled}
	title="Aplicar a configuração de exemplo (tema NEO)"
>
	<Icon iconName="autorenew" iconSize="sm" />
	Exemplo
</Button>
