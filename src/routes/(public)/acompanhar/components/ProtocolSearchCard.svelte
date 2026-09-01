<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';

	interface Props {
		onSearch: (protocol: string, email: string) => void;
	}

	let { onSearch }: Props = $props();

	let protocol = $state('');
	let email = $state('');

	let protocolError = $state('');
	let emailError = $state('');

	function isValidEmail(value: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const normalizedProtocol = protocol.trim();
		const normalizedEmail = email.trim();

		protocolError = '';
		emailError = '';

		if (!normalizedProtocol && !normalizedEmail) {
			protocolError = 'Informe o protocolo ou o e-mail.';
			return;
		}

		if (normalizedProtocol) {
			onSearch(normalizedProtocol, '');
			return;
		}

		if (!isValidEmail(normalizedEmail)) {
			emailError = 'Informe um e-mail válido.';
			return;
		}

		onSearch('', normalizedEmail);
	}
</script>

<form class="protocol-search-card" onsubmit={handleSubmit}>
	<div class="field">
		<Input
			label="Número do Protocolo"
			placeholder="Ex: NEO-2026-000102"
			prefix="#"
			error={protocolError}
			bind:value={protocol}
		/>
	</div>

	<div class="field">
		<Input
			type="email"
			label="E-mail Corporativo"
			placeholder="emaildofulano@neo.com.br"
			prefix="@"
			error={emailError}
			bind:value={email}
		/>
	</div>

	<div class="action">
		<Button type="submit">
			<Icon iconName="search" />
			Consultar Protocolo
		</Button>
	</div>
</form>

<style>
	.protocol-search-card {
		display: flex;
		align-items: flex-end;
		width: 100%;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
	}

	.field {
		flex: 1;
		min-width: 0;
	}

	.action {
		flex-shrink: 0;
	}
</style>