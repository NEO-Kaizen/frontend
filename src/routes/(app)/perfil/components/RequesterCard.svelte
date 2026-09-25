<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import { updateMyProfile } from '$lib/services/user.service';
	import { SectionState } from '$lib/states/section.svelte';
	import { untrack } from 'svelte';
	import type { RequesterProfileBlock } from '$lib/types/user';
	import { notifySectionSave } from '$lib/utils/feedback';
	import {
		isValidText,
		PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH,
		PROFILE_AREA_MAX_LENGTH,
		PROFILE_DEPARTMENT_MAX_LENGTH,
		PROFILE_MANAGER_MAX_LENGTH
	} from '$lib/utils/validations';
	import { optionalFieldError, requiredFieldError } from '../profile-validation';
	import ProfileCard from './ProfileCard.svelte';
	import ProfileSectionActions from './ProfileSectionActions.svelte';

	interface Props {
		requester: RequesterProfileBlock | null;
		canEditAdministrativeFields: boolean;
		onSaved: () => void;
	}

	type RequesterDraft = {
		area: string;
		department: string;
		manager: string;
		additionalContact: string;
	};

	let { requester, canEditAdministrativeFields, onSaved }: Props = $props();

	let submitted = $state(false);

	function toDraft(block: RequesterProfileBlock | null): RequesterDraft {
		return {
			area: block?.area ?? '',
			department: block?.department ?? '',
			manager: block?.manager ?? '',
			additionalContact: block?.additionalContact ?? ''
		};
	}

	const initial = untrack(() => toDraft(requester));

	const section = new SectionState<RequesterDraft>(initial, initial, async (draft) => {
		const administrativeFields = canEditAdministrativeFields
			? {
					area: draft.area.trim(),
					department: draft.department.trim() || null,
					manager: draft.manager.trim()
				}
			: {};

		const result = await updateMyProfile({
			requester: {
				...administrativeFields,
				additionalContact: draft.additionalContact.trim() || null
			}
		});

		if (!result.ok) return result;

		return {
			ok: true,
			data: toDraft(result.data.requester)
		};
	});

	function requiredTextError(value: string, label: string, maxLength: number): string {
		const basicError = requiredFieldError(value, label, maxLength);
		if (basicError) return basicError;
		const sentenceLabel = label.charAt(0).toUpperCase() + label.slice(1);
		return isValidText(value.trim()) ? '' : `${sentenceLabel} deve conter apenas letras e espaços.`;
	}

	function optionalTextError(value: string, label: string, maxLength: number): string {
		const trimmed = value.trim();
		if (!trimmed) return '';
		const sentenceLabel = label.charAt(0).toUpperCase() + label.slice(1);
		if (!isValidText(trimmed)) return `${sentenceLabel} deve conter apenas letras e espaços.`;
		return optionalFieldError(trimmed, maxLength);
	}

	const errors = $derived({
		area: canEditAdministrativeFields
			? requiredTextError(section.draft.area, 'a área', PROFILE_AREA_MAX_LENGTH)
			: '',
		department: canEditAdministrativeFields
			? optionalTextError(section.draft.department, 'o departamento', PROFILE_DEPARTMENT_MAX_LENGTH)
			: '',
		manager: canEditAdministrativeFields
			? requiredTextError(section.draft.manager, 'o gestor', PROFILE_MANAGER_MAX_LENGTH)
			: '',
		additionalContact: optionalFieldError(
			section.draft.additionalContact,
			PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH
		)
	});

	const invalid = $derived(
		Boolean(errors.area || errors.department || errors.manager || errors.additionalContact)
	);
	const isPendingAdmin = $derived(
		!canEditAdministrativeFields && (!requester?.area?.trim() || !requester?.manager?.trim())
	);

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
	description={canEditAdministrativeFields
		? 'Informações administrativas usadas nas solicitações que você abre no portal.'
		: 'Informações usadas nas solicitações que você abre no portal. Área, departamento e gestor são preenchidos pelo administrador.'}
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
		{#if canEditAdministrativeFields}
			<Input
				label="Área do solicitante *"
				name="area"
				placeholder="Ex.: Tecnologia"
				maxlength={PROFILE_AREA_MAX_LENGTH}
				bind:value={section.draft.area}
				error={submitted ? errors.area : ''}
			/>

			<Input
				label="Departamento"
				name="department"
				placeholder="Ex.: Desenvolvimento"
				maxlength={PROFILE_DEPARTMENT_MAX_LENGTH}
				bind:value={section.draft.department}
				error={submitted ? errors.department : ''}
			/>

			<Input
				label="Gestor responsável *"
				name="manager"
				placeholder="Nome do gestor"
				maxlength={PROFILE_MANAGER_MAX_LENGTH}
				bind:value={section.draft.manager}
				error={submitted ? errors.manager : ''}
			/>
		{:else}
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
		{/if}

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
