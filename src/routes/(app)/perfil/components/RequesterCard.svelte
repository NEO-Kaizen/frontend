<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import { updateMyProfile } from '$lib/services/user.service';
	import { SectionState } from '$lib/states/section.svelte';
	import { untrack } from 'svelte';
	import type { RequesterProfileBlock } from '$lib/types/user';
	import { notifySectionSave } from '$lib/utils/feedback';
	import { PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH } from '$lib/utils/validations';
	import { optionalFieldError } from '../profile-validation';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileSectionActions from './ProfileSectionActions.svelte';

	interface Props {
		requester: RequesterProfileBlock | null;
		onSaved: () => void;
	}

	let { requester, onSaved }: Props = $props();

	let submitted = $state(false);

	function toContact(block: RequesterProfileBlock | null): string {
		return block?.additionalContact ?? '';
	}

	const initialContact = untrack(() => toContact(requester));
	const initial = { additionalContact: initialContact };

	const section = new SectionState<{ additionalContact: string }>(
		initial,
		initial,
		async (draft) => {
			// Área/Departamento/Gestor são preenchidos pelo administrador no
			// cadastro; o backend recusa esses campos no self-service (403). O
			// solicitante envia apenas o bloco parcial com `additionalContact`.
			const result = await updateMyProfile({
				requester: { additionalContact: draft.additionalContact.trim() || undefined }
			});

			if (!result.ok) return result;

			return {
				ok: true,
				data: { additionalContact: result.data.requester?.additionalContact ?? '' }
			};
		}
	);

	const errors = $derived({
		additionalContact: optionalFieldError(
			section.draft.additionalContact,
			PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH
		)
	});

	const invalid = $derived(Boolean(errors.additionalContact));
	const isPendingAdmin = $derived(!requester?.area?.trim() || !requester?.manager?.trim());

	async function handleSave() {
		submitted = true;

		if (invalid) return;

		if (notifySectionSave(await section.save())) {
			onSaved();
		}
	}

	function handleCancel() {
		submitted = false;
		section.reset();
	}

	function display(value: string | null | undefined): string {
		const trimmed = value?.trim();
		return trimmed ? trimmed : '---';
	}
</script>

<ProfileCard
	title="Dados de solicitante"
	description="Informações usadas nas solicitações que você abre no portal. Área, departamento e gestor são preenchidos pelo administrador."
>
	{#snippet actions()}
		<ProfileSectionActions
			dirty={section.dirty}
			saving={section.saving}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	{/snippet}

	<div class="requester-fields">
		<div class="readonly-field">
			<span class="readonly-label">Área do solicitante *</span>
			<p class="readonly-value">{display(requester?.area)}</p>
		</div>

		<div class="readonly-field">
			<span class="readonly-label">Departamento</span>
			<p class="readonly-value">{display(requester?.department)}</p>
		</div>

		<div class="readonly-field">
			<span class="readonly-label">Gestor responsável *</span>
			<p class="readonly-value">{display(requester?.manager)}</p>
		</div>

		<Input
			label="Contato adicional"
			name="additionalContact"
			placeholder="Ex.: ramal ou telefone"
			maxlength={PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH}
			bind:value={section.draft.additionalContact}
			error={submitted ? errors.additionalContact : ''}
		/>
	</div>

	{#if isPendingAdmin}
		<p class="pending-hint" role="note">
			Área, departamento e gestor ainda não foram preenchidos pelo administrador. Procure o
			administrador para regularizar seu cadastro.
		</p>
	{/if}
</ProfileCard>

<style>
	.requester-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	.readonly-field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--background-color);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		min-height: 42px;
		justify-content: center;
	}

	.readonly-label {
		font: var(--label);
		color: var(--black);
		font-size: 12px;
	}

	.readonly-value {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
		word-break: break-word;
	}

	.pending-hint {
		margin: var(--spacing-sm) 0 0;
		font: var(--label);
		font-size: 12px;
		color: var(--status-orange, var(--gray));
	}

	@media (max-width: 700px) {
		.requester-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
