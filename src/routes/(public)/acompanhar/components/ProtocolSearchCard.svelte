<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';

	interface Props {
		onSearch: (protocol: string, email: string) => void;
		isSearching?: boolean;
	}

	let { onSearch, isSearching = false }: Props = $props();

	let protocol = $state('');
	let email = $state('');
	let hasSubmitted = $state(false);

	function formatProtocol(value: string) {
		const digits = value.replace(/\D/g, '').slice(0, 10);

		if (!digits) {
			return '';
		}

		const year = digits.slice(0, 4);
		const number = digits.slice(4, 10);

		if (digits.length <= 4) {
			return `NEO-${year}`;
		}

		return `NEO-${year}-${number}`;
	}

	function handleProtocolInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		protocol = formatProtocol(input.value);
	}

	function isValidProtocol(value: string) {
		return /^NEO-\d{4}-\d{6}$/.test(value);
	}

	function isValidEmail(value: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	let formError = $derived(
		hasSubmitted && !protocol.trim() && !email.trim()
			? 'Informe o protocolo ou o e-mail.'
			: ''
	);

	let protocolError = $derived(
		protocol.trim() && !isValidProtocol(protocol.trim())
			? 'Informe um protocolo válido.'
			: ''
	);

	let emailError = $derived(
		email.trim() && !isValidEmail(email.trim())
			? 'Informe um e-mail válido.'
			: ''
	);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		hasSubmitted = true;

		const normalizedProtocol = protocol.trim();
		const normalizedEmail = email.trim();

		if (!normalizedProtocol && !normalizedEmail) {
			return;
		}

		if (isValidProtocol(normalizedProtocol)) {
			onSearch(normalizedProtocol, '');
			return;
		}

		if (isValidEmail(normalizedEmail)) {
			onSearch('', normalizedEmail);
		}
	}
</script>

<form class="protocol-search-card" onsubmit={handleSubmit} novalidate>
	{#if formError}
		<p class="form-error" role="alert">
			{formError}
		</p>
	{/if}

	<div class="field">
		<Input
			label="Número do Protocolo"
			placeholder="Ex: NEO-2026-000102"
			prefix="#"
			maxlength={15}
			oninput={handleProtocolInput}
			bind:value={protocol}
		/>

		{#if protocolError}
			<p class="field-error" role="alert">
				{protocolError}
			</p>
		{/if}
	</div>

	<div class="field">
		<Input
			type="email"
			label="E-mail Corporativo"
			placeholder="emaildofulano@neo.com.br"
			prefix="@"
			bind:value={email}
		/>

		{#if emailError}
			<p class="field-error" role="alert">
				{emailError}
			</p>
		{/if}
	</div>

	<div class="action">
		<Button type="submit" disabled={isSearching}>
			<Icon iconName="search" />
			{isSearching ? 'Consultando...' : 'Consultar Protocolo'}
		</Button>
	</div>
</form>

<style>
	.protocol-search-card {
		position: relative;
		display: flex;
		align-items: flex-end;
		width: 100%;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
	}

	.form-error {
		position: absolute;
		top: 4px;
		left: var(--spacing-lg);
		margin: 0;
		color: var(--status-red);
		font: var(--label);
	}

	.field {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.field-error {
		position: absolute;
		top: 97%;
		left: 0;
		margin: 4px 0 0;
		color: var(--status-red);
		font: var(--label);
	}

	.action {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.protocol-search-card {
			flex-direction: column;
			align-items: stretch;
		}

		.field {
			width: 100%;
		}

		.action {
			width: 100%;
		}
	}
</style>
