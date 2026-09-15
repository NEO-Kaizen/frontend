<script lang="ts">
	import SolicitationForm from './components/solicitation-form/SolicitationForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main class="content-container">
	<SolicitationForm user={data.user} solicitationMode={data.portalConfig.solicitationMode} />
</main>
