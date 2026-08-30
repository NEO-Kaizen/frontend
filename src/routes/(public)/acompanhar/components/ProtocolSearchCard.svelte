<script lang="ts">
	interface Props {
		onSearch: (protocolo: string, email: string) => void;
	}

	let { onSearch }: Props = $props();

	let pesquisou = $state(false);
	let protocolo = $state('');
	let email = $state('');

	function consultarProtocolo() {
		if (!protocolo && !email) {
			console.log('Preencha o protocolo ou o e-mail.');
			return;
		}

		pesquisou = true;

		onSearch(protocolo, email);
	}
</script>

<div class="consulta">
	<div class="campo">
		<label for="protocolo">Número do Protocolo</label>

		<div class="input-container">
			<span class="input-icon">#</span>

			<input
				id="protocolo"
				type="text"
				placeholder="Ex: NEO-2026-000102"
				bind:value={protocolo}
			/>
		</div>
	</div>

	<div class="campo">
		<label for="email">E-mail Corporativo</label>

		<div class="input-container">
			<span class="input-icon">@</span>

			<input id="email" type="email" placeholder="emaildofulano@neo.com.br" bind:value={email} />
		</div>
	</div>

	<button
		type="button"
		class="consultar"
		onclick=
			{consultarProtocolo}
	
	>
		Consultar Protocolo
	</button>
</div>

<style>
  .consulta {
		display: flex;
		align-items: flex-end;
		width: 100%;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
	}

	.campo {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.campo label {
		margin-bottom: var(--spacing-sm);
		color: var(--black);
	}

	.input-container {
		display: flex;
		align-items: center;
		width: 100%;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
	}

	.input-icon {
		padding-left: var(--spacing-md);
		color: var(--gray);
		font: var(--paragrafo);
	}

	.input-container input {
		width: 100%;
		padding: var(--spacing-md);
		border: none;
		outline: none;
		background: transparent;
		color: var(--black);
		font: var(--paragrafo);
	}

	.input-container:focus-within {
		border-color: var(--secondary-color);
	}

	.consultar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-xl);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--primary-color);
		color: var(--white);
		cursor: pointer;
		white-space: nowrap;
	}
</style>