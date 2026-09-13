<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';
	import Input from '$lib/components/Input.svelte';

	type IdentityField = 'platformName' | 'protocolMask';

	interface Props {
		platformName: string;
		protocolMask: string;
		saving: boolean;
		errors: { platformName?: string; protocolMask?: string };
		onchange: (field: IdentityField, value: string) => void;
	}

	let { platformName, protocolMask, saving, errors, onchange }: Props = $props();

	function getPlatformName() {
		return platformName;
	}

	function setPlatformName(value: string) {
		onchange('platformName', value);
	}

	function getProtocolMask() {
		return protocolMask;
	}

	function setProtocolMask(value: string) {
		onchange('protocolMask', value);
	}
</script>

<SettingsCard
	iconName="description"
	title="2. Identidade da plataforma"
	description="Defina o nome exibido e a máscara de protocolo."
>
	<div class="card-fields">
		<Input
			label="Nome da plataforma"
			maxlength={80}
			placeholder="Ex.: MAAT"
			bind:value={getPlatformName, setPlatformName}
			error={errors.platformName}
			disabled={saving}
		/>
		<Input
			label="Máscara de protocolo"
			maxlength={40}
			placeholder="Ex.: MAAT"
			bind:value={getProtocolMask, setProtocolMask}
			error={errors.protocolMask}
			disabled={saving}
		/>
	</div>
</SettingsCard>

<style>
	.card-fields {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
</style>
