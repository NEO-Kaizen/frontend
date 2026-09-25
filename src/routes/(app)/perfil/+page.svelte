<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import ProfessionalCard from './components/ProfessionalCard.svelte';
	import ProfileIdentityCard from './components/ProfileIdentityCard.svelte';
	import RequesterCard from './components/RequesterCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Após qualquer gravação, relê o perfil no servidor para manter a tela e a
	// sessão consistentes com o backend.
	async function handleChanged() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Meus dados - {data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container profile-page">
	<header class="page-header">
		<h1>Meus dados</h1>
		<p class="page-subtitle">
			Gerencie suas informações de perfil no {data.portalConfig.platformName}.
		</p>
	</header>

	{#if data.result.ok}
		{@const profile = data.result.data}

		<ProfileIdentityCard {profile} onChanged={handleChanged} />

		<RequesterCard
			requester={profile.requester}
			canEditAdministrativeFields={profile.role === 'Administrador'}
			onSaved={handleChanged}
		/>

		{#if profile.role === 'Analista'}
			<ProfessionalCard
				professional={profile.professional}
				categories={data.portalConfig.categories}
			/>
		{/if}
	{:else}
		<div class="load-error" role="alert">
			<p>{data.result.error.message}</p>
			<Button variant="outline" onclick={() => invalidateAll()}>Tentar novamente</Button>
		</div>
	{/if}
</main>

<style>
	.profile-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.page-header h1 {
		margin: 0;
		font: var(--h1);
		color: var(--heading-color);
	}

	.page-subtitle {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
	}

	.load-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		padding: var(--spacing-md) var(--spacing-lg);
		border: 1px solid var(--status-error);
		border-radius: var(--radius-sm);
		background-color: var(--status-error-bg);
		color: var(--text-color-primary);
	}

	.load-error p {
		margin: 0;
		font-size: 14px;
	}
</style>
