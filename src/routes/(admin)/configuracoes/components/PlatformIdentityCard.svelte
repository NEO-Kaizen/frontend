<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Input from '$lib/components/Input.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { saveIdentity } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import type { IdentitySection, UpdateIdentityRequest } from '$lib/types/portal-config';
	import {
		isValidPlatformName,
		isValidProtocolMask,
		MAX_PROTOCOL_MASK_LENGTH
	} from '$lib/utils/validations';
	import { notifySectionSave } from '$lib/utils/feedback';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<IdentitySection>(
		{
			platformName: page.data.portalConfig.platformName,
			protocolMask: page.data.portalConfig.protocolMask
		},
		{
			platformName: DEFAULT_PORTAL_CONFIG.platformName,
			protocolMask: DEFAULT_PORTAL_CONFIG.protocolMask
		},
		// Identidade é parcial: envia apenas os campos alterados.
		(draft, pristine) => {
			const payload: UpdateIdentityRequest = {};
			if (draft.platformName !== pristine.platformName) payload.platformName = draft.platformName;
			if (draft.protocolMask !== pristine.protocolMask) payload.protocolMask = draft.protocolMask;
			return saveIdentity(payload);
		}
	);

	// Vazio também é inválido para impedir salvar sem valor.
	const fieldErrors: { platformName?: string; protocolMask?: string } = $derived({
		...(isValidPlatformName(section.draft.platformName)
			? {}
			: { platformName: 'Informe um nome com até 80 caracteres.' }),
		...(isValidProtocolMask(section.draft.protocolMask)
			? {}
			: { protocolMask: 'Apenas letras e números, até 10 caracteres.' })
	});

	const invalid = $derived(
		fieldErrors.platformName !== undefined || fieldErrors.protocolMask !== undefined
	);

	function buildProtocolExample(mask: string) {
		const clean = mask.trim().toUpperCase();
		return clean ? `${clean}-8K3P-9X2M` : '';
	}

	const protocolExample = $derived(buildProtocolExample(section.draft.protocolMask));

	function getPlatformName() {
		return section.draft.platformName;
	}

	function setPlatformName(value: string) {
		section.draft = { ...section.draft, platformName: value };
	}

	function getProtocolMask() {
		return section.draft.protocolMask;
	}

	function setProtocolMask(value: string) {
		section.draft = {
			...section.draft,
			protocolMask: value.replace(/[^A-Za-z0-9]/g, '').slice(0, MAX_PROTOCOL_MASK_LENGTH)
		};
	}

	async function handleSave() {
		if (notifySectionSave(await section.save())) {
			await invalidateAll();
		}
	}
</script>

<SettingsCard
	iconName="description"
	title="2. Identidade da plataforma"
	description="Defina o nome exibido e a máscara de protocolo."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			restorable={section.restorable}
			{invalid}
			onSave={handleSave}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	<div class="card-fields">
		<Input
			label="Nome da plataforma"
			maxlength={80}
			placeholder="Ex.: MAAT"
			bind:value={getPlatformName, setPlatformName}
			error={fieldErrors.platformName}
			disabled={section.saving}
		/>
		<Input
			label="Máscara de protocolo"
			maxlength={10}
			placeholder="Ex.: MAAT"
			hint={protocolExample ? `Exemplo: ${protocolExample}` : undefined}
			bind:value={getProtocolMask, setProtocolMask}
			error={fieldErrors.protocolMask}
			disabled={section.saving}
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
