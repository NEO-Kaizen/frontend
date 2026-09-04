<script lang="ts">
	import { page } from '$app/state';
	import SolicitationTable from '../components/SolicitationTable.svelte';

	// Captura o protocolo da rota (/[protocolo])
	let protocoloBuscado = $derived(page.params.protocolo ?? '');
</script>

<SolicitationTable protocolo={protocoloBuscado} />
