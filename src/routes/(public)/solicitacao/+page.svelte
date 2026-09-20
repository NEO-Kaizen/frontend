<script lang="ts">
	import SolicitationForm from './components/solicitation-form/SolicitationForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const categoryOptions = $derived(
		data.portalConfig.categories
			.filter((category) => category.isActive)
			.map((category) => ({ value: category.name, label: category.name }))
	);
</script>

<main class="content-container">
	<SolicitationForm
		user={data.user}
		solicitationMode={data.portalConfig.solicitationMode}
		{categoryOptions}
	/>
</main>
