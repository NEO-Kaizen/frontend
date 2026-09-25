<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import { isValidEmail, isProtocol } from '$lib/utils/validations';
	import { onMount } from 'svelte';

	const protocolMask = $derived(page.data.portalConfig.protocolMask);

	interface Props {
		isOwnerView?: boolean;
	}

	let { isOwnerView = false }: Props = $props();

	let isSearching = $state(false);
	let protocol = $state('');
	let email = $state('');
	let hasSubmitted = $state(false);

	onMount(() => {
		function handlePageShow() {
			isSearching = false;
		}

		window.addEventListener('pageshow', handlePageShow);

		return () => {
			window.removeEventListener('pageshow', handlePageShow);
		};
	});

	function handleProtocolInput() {
		hasSubmitted = false;
	}

	function handleEmailInput() {
		hasSubmitted = false;
	}

	let formError = $derived(
		hasSubmitted && !protocol.trim() && !isOwnerView && !email.trim()
			? 'Informe o protocolo' + (isOwnerView ? '.' : ' ou o e-mail.')
			: ''
	);

	let protocolError = $derived(
		protocol.trim() && !isProtocol(protocol.trim()) ? 'Informe um protocolo válido.' : ''
	);

	let emailError = $derived(
		email.trim() && !isValidEmail(email.trim()) ? 'Informe um e-mail válido.' : ''
	);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		hasSubmitted = true;

		const normalizedProtocol = protocol.trim().toUpperCase();
		const normalizedEmail = email.trim();

		if (!normalizedProtocol && !isOwnerView && !normalizedEmail) {
			return;
		}
		if (!normalizedProtocol && isOwnerView) {
			return;
		}

		try {
			if (isProtocol(normalizedProtocol)) {
				isSearching = true;
				await goto(resolve('/(public)/acompanhar/[protocolo]', { protocolo: normalizedProtocol }));
				return;
			}

			if (isOwnerView) return;

			if (isValidEmail(normalizedEmail)) {
				isSearching = true;
				const search = new URLSearchParams({ email: normalizedEmail }).toString();
				await goto(resolve(`/(public)/acompanhar?${search}`));
			}
		} finally {
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
			placeholder={`Ex: ${protocolMask}-A1B2-C3D4`}
			prefix="#"
			maxlength={protocolMask.length + 10}
			error={protocolError}
			oninput={handleProtocolInput}
			bind:value={protocol}
		/>
	</div>

	{#if !isOwnerView}
		<div class="field">
			<Input
				type="email"
				label="E-mail Corporativo"
				placeholder="emaildofulano@maat.com.br"
				prefix="@"
				error={emailError}
				oninput={handleEmailInput}
				bind:value={email}
			/>
		</div>
	{/if}

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
	.field :global(input.error:focus-visible) {
		outline-color: var(--status-red);
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
