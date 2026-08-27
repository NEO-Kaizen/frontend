<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';

	let { onSearch } = $props<{ onSearch?: (protocol: string) => void }>();

	let protocolNumber = $state('');
	let email = $state('');

	function handleSearch(event: SubmitEvent) {
		event.preventDefault();
		if (onSearch) {
			onSearch(protocolNumber.trim());
		}
	}
</script>

<div class="search-section-container">
	<div class="header-titles">
		<h1>Acompanhar Solicitação</h1>
		<p>Consulte em tempo real os status da sua demanda institucional.</p>
	</div>

	<div class="search-card-horizontal">
		<form onsubmit={handleSearch} class="search-form-row">
			<div class="input-field">
				<Input
					label="Número do Protocolo"
					placeholder="Ex: NEO-2026-08-9842"
					bind:value={protocolNumber}
				/>
			</div>
			<div class="input-field">
				<Input
					label="E-mail Corporativo"
					placeholder="emaildofulano@neo.com.br"
					bind:value={email}
				/>
			</div>
			<div class="button-field">
				<Button type="submit" variant="primary">
					<span class="btn-content">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
						Consultar Protocolo
					</span>
				</Button>
			</div>
		</form>
	</div>
</div>

<style>
	.search-section-container {
		width: 100%;
		max-width: 1100px;
		margin: 0 auto 32px auto;
	}

	.header-titles h1 {
		font-size: 1.875rem;
		font-weight: 700;
		color: #002068;
		margin: 0 0 6px 0;
	}

	.header-titles p {
		color: #475569;
		font-size: 1rem;
		margin: 0 0 24px 0;
	}

	.search-card-horizontal {
		background-color: #ffffff;
		border-radius: 16px;
		padding: 24px 32px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
		border: 1px solid #f1f5f9;
	}

	.search-form-row {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 20px;
		align-items: end;
	}

	.input-field {
		width: 100%;
	}

	.button-field {
		padding-bottom: 2px;
	}

	.btn-content {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
	}
</style>
