<script lang="ts">
	import { page } from '$app/state';
	import ProtocolSearchCard from './components/ProtocolSearchCard.svelte';
	import SolicitationTable from './components/SolicitationTable.svelte';

	let emailBuscado = $derived(page.url.searchParams.get('email') ?? '');
</script>

<main class="content-container">
	<div class="header-acompanhar">
		<h1>Acompanhar Solicitações</h1>
		<p>Consulte em tempo real os status da sua demanda institucional.</p>
	</div>

	<ProtocolSearchCard />

	<div style="margin-top: var(--spacing-xl);">
		<SolicitationTable email={emailBuscado} />
	</div>
</main>

<style>
	.header-acompanhar {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.header-acompanhar p {
		margin: 0;
		color: var(--gray);
	}
</style>
