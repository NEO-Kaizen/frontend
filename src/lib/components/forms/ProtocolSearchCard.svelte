<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$lib/components/layout/Card.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import Button from '$lib/components/layout/Button.svelte';

	let protocolNumber = $state('');

	function handleSearch(event: SubmitEvent) {
		event.preventDefault();
		if (!protocolNumber.trim()) return;

		goto(`/acompanhar/${protocolNumber.trim()}`);
	}
</script>

<Card padding="lg">
	<div class="card-content">
		<h2>Consultar Protocolo</h2>
		<p>Informe o número do protocolo para visualizar o andamento da sua solicitação.</p>

		<form onsubmit={handleSearch} class="search-form">
			<div class="input-wrapper">
				<Input
					label="Número do Protocolo"
					placeholder="Ex: 2026.0825.001"
					bind:value={protocolNumber}
				/>
			</div>
			<div class="button-wrapper">
				<Button type="submit" variant="primary">Consultar</Button>
			</div>
		</form>
	</div>
</Card>

<style>
	.card-content h2 {
		font: var(--h3);
		color: var(--primary-color);
		margin-bottom: var(--spacing-xs);
	}

	.card-content p {
		font: var(--paragrafo);
		color: var(--gray);
		margin-bottom: var(--spacing-md);
	}

	.search-form {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-md);
		width: 100%;
	}

	.input-wrapper {
		flex: 1;
	}

	.button-wrapper {
		margin-bottom: 2px;
	}

	@media (max-width: 600px) {
		.search-form {
			flex-direction: column;
			align-items: stretch;
		}

		.button-wrapper {
			margin-bottom: 0;
		}
	}
</style>