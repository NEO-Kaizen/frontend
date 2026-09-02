<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';

	let isSearching = $state(false);
	let protocol = $state('');
	let email = $state('');
	let hasSubmitted = $state(false);

	function formatProtocol(value: string) {
		const normalized = value
			.replace(/[^A-Z0-9]/gi, '')
			.toUpperCase()
			.slice(0, 12);

		const firstBlock = normalized.slice(0, 4);
		const secondBlock = normalized.slice(4, 8);
		const thirdBlock = normalized.slice(8, 12);

		if (normalized.length <= 4) {
			return firstBlock;
		}

		if (normalized.length <= 8) {
			return `${firstBlock}-${secondBlock}`;
		}

		return `${firstBlock}-${secondBlock}-${thirdBlock}`;
	}

	function handleProtocolInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const formattedProtocol = formatProtocol(input.value);

		input.value = formattedProtocol;
		protocol = formattedProtocol;
	}

	function isProtocol(value: string): boolean {
		return /^[A-Z]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(value);
	}

	function isEmail(value: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	let formError = $derived(
		hasSubmitted && !protocol.trim() && !email.trim() ? 'Informe o protocolo ou o e-mail.' : ''
	);

	let protocolError = $derived(
		protocol.trim() && !isProtocol(protocol.trim()) ? 'Informe um protocolo válido.' : ''
	);

	let emailError = $derived(
		email.trim() && !isEmail(email.trim()) ? 'Informe um e-mail válido.' : ''
	);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		hasSubmitted = true;

		const normalizedProtocol = protocol.trim();
		const normalizedEmail = email.trim();

		if (!normalizedProtocol && !normalizedEmail) {
			return;
		}

		if (isProtocol(normalizedProtocol)) {
			isSearching = true;
			await goto(resolve('/(public)/acompanhar/[protocolo]', { protocolo: normalizedProtocol }));
			isSearching = false;
			return;
		}

		if (isEmail(normalizedEmail)) {
			isSearching = true;
			const search = new URLSearchParams({ email: normalizedEmail }).toString();
			await goto(resolve(`/(public)/acompanhar?${search}`));
			isSearching = false;
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
			placeholder="Ex: MAAT-2026-0001"
			prefix="#"
			maxlength={14}
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
