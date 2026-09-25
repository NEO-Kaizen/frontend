<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { getUser, updateUser } from '$lib/services/user.service';
	import type { PortalCategory } from '$lib/types/portal-config';
	import type { AdminUser, UserProfileResponse } from '$lib/types/user';
	import {
		isRequired,
		isValidText,
		PROFILE_AREA_MAX_LENGTH,
		PROFILE_DEPARTMENT_MAX_LENGTH,
		PROFILE_FULL_NAME_MAX_LENGTH,
		PROFILE_JOB_TITLE_MAX_LENGTH,
		PROFILE_MANAGER_MAX_LENGTH,
		PROFILE_NOTES_MAX_LENGTH,
		PROFILE_SPECIALTY_MAX_LENGTH
	} from '$lib/utils/validations';
	import ProfessionalFields from './ProfessionalFields.svelte';

	interface Props {
		user: AdminUser;
		categories: PortalCategory[];
		onclose: () => void;
		onsaved: (profile: UserProfileResponse) => void;
	}

	let { user, categories, onclose, onsaved }: Props = $props();

	let isLoading = $state(true);
	let isSaving = $state(false);
	let loadError = $state('');
	let saveError = $state('');

	let fullName = $state('');
	let area = $state('');
	let department = $state('');
	let manager = $state('');
	let jobTitle = $state('');
	let specialties = $state<string[]>([]);
	let attendedCategoryIds = $state<number[]>([]);
	let professionalNotes = $state('');

	let fullNameError = $state('');
	let areaError = $state('');
	let departmentError = $state('');
	let managerError = $state('');
	let jobTitleError = $state('');
	let specialtiesError = $state('');
	let categoriesError = $state('');
	let professionalNotesError = $state('');

	const activeCategories = $derived(categories.filter((category) => category.isActive));

	function hydrate(profile: UserProfileResponse) {
		fullName = profile.fullName;
		area = profile.requester?.area ?? '';
		department = profile.requester?.department ?? '';
		manager = profile.requester?.manager ?? '';
		jobTitle = profile.professional?.jobTitle ?? '';
		specialties = profile.professional?.specialties ?? [];
		attendedCategoryIds = profile.professional?.attendedCategoryIds ?? [];
		professionalNotes = profile.professional?.notes ?? '';
	}

	async function loadProfile() {
		isLoading = true;
		loadError = '';
		const result = await getUser(user.id);
		isLoading = false;
		if (!result.ok) {
			loadError = result.error.message;
			return;
		}
		hydrate(result.data);
	}

	function validate(): boolean {
		fullNameError = '';
		areaError = '';
		departmentError = '';
		managerError = '';
		jobTitleError = '';
		specialtiesError = '';
		categoriesError = '';
		professionalNotesError = '';

		const trimmedFullName = fullName.trim();
		const trimmedArea = area.trim();
		const trimmedDepartment = department.trim();
		const trimmedManager = manager.trim();

		if (!isRequired(trimmedFullName)) fullNameError = 'Informe o nome completo.';
		else if (!isValidText(trimmedFullName)) {
			fullNameError = 'O nome deve conter apenas letras e espaços.';
		} else if (trimmedFullName.length > PROFILE_FULL_NAME_MAX_LENGTH) {
			fullNameError = `O nome deve ter no máximo ${PROFILE_FULL_NAME_MAX_LENGTH} caracteres.`;
		}

		if (!isRequired(trimmedArea)) areaError = 'Informe a área do solicitante.';
		else if (!isValidText(trimmedArea)) areaError = 'A área deve conter apenas letras e espaços.';
		else if (trimmedArea.length > PROFILE_AREA_MAX_LENGTH) {
			areaError = `A área deve ter no máximo ${PROFILE_AREA_MAX_LENGTH} caracteres.`;
		}

		if (trimmedDepartment && !isValidText(trimmedDepartment)) {
			departmentError = 'O departamento deve conter apenas letras e espaços.';
		} else if (trimmedDepartment.length > PROFILE_DEPARTMENT_MAX_LENGTH) {
			departmentError = `O departamento deve ter no máximo ${PROFILE_DEPARTMENT_MAX_LENGTH} caracteres.`;
		}

		if (!isRequired(trimmedManager)) managerError = 'Informe o gestor responsável.';
		else if (!isValidText(trimmedManager)) {
			managerError = 'O gestor deve conter apenas letras e espaços.';
		} else if (trimmedManager.length > PROFILE_MANAGER_MAX_LENGTH) {
			managerError = `O gestor deve ter no máximo ${PROFILE_MANAGER_MAX_LENGTH} caracteres.`;
		}

		if (user.role === 'Analista') {
			if (!jobTitle.trim()) jobTitleError = 'Informe o cargo do analista.';
			else if (jobTitle.trim().length > PROFILE_JOB_TITLE_MAX_LENGTH) {
				jobTitleError = `O cargo deve ter no máximo ${PROFILE_JOB_TITLE_MAX_LENGTH} caracteres.`;
			}
			if (specialties.length === 0) specialtiesError = 'Informe ao menos uma especialidade.';
			else if (specialties.some((item) => item.length > PROFILE_SPECIALTY_MAX_LENGTH)) {
				specialtiesError = `Cada especialidade deve ter no máximo ${PROFILE_SPECIALTY_MAX_LENGTH} caracteres.`;
			}
			if (attendedCategoryIds.length === 0) {
				categoriesError = 'Selecione ao menos uma categoria atendida.';
			}
			if (professionalNotes.length > PROFILE_NOTES_MAX_LENGTH) {
				professionalNotesError = `As observações devem ter no máximo ${PROFILE_NOTES_MAX_LENGTH} caracteres.`;
			}
		}

		return !(
			fullNameError ||
			areaError ||
			departmentError ||
			managerError ||
			jobTitleError ||
			specialtiesError ||
			categoriesError ||
			professionalNotesError
		);
	}

	async function handleSave() {
		if (isSaving || !validate()) return;
		isSaving = true;
		saveError = '';

		const result = await updateUser(user.id, {
			fullName: fullName.trim(),
			requester: {
				area: area.trim(),
				department: department.trim() || null,
				manager: manager.trim()
			},
			professional:
				user.role === 'Analista'
					? {
							jobTitle: jobTitle.trim(),
							specialties: specialties.map((item) => item.trim()),
							attendedCategoryIds,
							notes: professionalNotes.trim() || undefined
						}
					: undefined
		});

		isSaving = false;
		if (!result.ok) {
			saveError = result.error.message;
			return;
		}

		onsaved(result.data);
	}

	onMount(loadProfile);
</script>

<Modal title={`Alterar dados de ${user.name}`} {onclose} size="lg">
	{#if isLoading}
		<div class="state" role="status">
			<span class="spinner" aria-hidden="true"></span>
			<p>Carregando dados do usuário...</p>
		</div>
	{:else if loadError}
		<div class="state error" role="alert">
			<p>{loadError}</p>
			<Button variant="outline" onclick={loadProfile}>Tentar novamente</Button>
		</div>
	{:else}
		<div class="form-content">
			<p class="description">
				O Administrador pode corrigir o nome e os dados administrativos. O contato adicional
				continua disponível ao próprio usuário.
			</p>

			<Input
				label="Nome completo *"
				maxlength={PROFILE_FULL_NAME_MAX_LENGTH}
				bind:value={fullName}
				error={fullNameError}
				disabled={isSaving}
			/>

			<div class="form-row">
				<Input
					label="Área do solicitante *"
					maxlength={PROFILE_AREA_MAX_LENGTH}
					bind:value={area}
					error={areaError}
					disabled={isSaving}
				/>
				<Input
					label="Departamento"
					maxlength={PROFILE_DEPARTMENT_MAX_LENGTH}
					bind:value={department}
					error={departmentError}
					disabled={isSaving}
				/>
			</div>

			<Input
				label="Gestor responsável *"
				maxlength={PROFILE_MANAGER_MAX_LENGTH}
				bind:value={manager}
				error={managerError}
				disabled={isSaving}
			/>

			{#if user.role === 'Analista'}
				<ProfessionalFields
					categories={activeCategories}
					bind:jobTitle
					bind:specialties
					bind:attendedCategoryIds
					bind:notes={professionalNotes}
					{jobTitleError}
					{specialtiesError}
					{categoriesError}
					notesError={professionalNotesError}
					disabled={isSaving}
				/>
			{/if}

			{#if saveError}
				<p class="form-error" role="alert">{saveError}</p>
			{/if}

			<div class="modal-actions">
				<Button variant="outline-neutral" onclick={onclose} disabled={isSaving}>Cancelar</Button>
				<Button variant="primary" onclick={handleSave} loading={isSaving}>Salvar alterações</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.form-content,
	.state {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.description,
	.state p {
		margin: 0;
		font: var(--paragrafo);
		color: var(--gray);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md);
	}

	.state {
		align-items: center;
		justify-content: center;
		min-height: 180px;
		text-align: center;
	}

	.spinner {
		width: 28px;
		height: 28px;
		border: 3px solid var(--border-color);
		border-right-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.form-error {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background-color: var(--status-error-bg);
		color: var(--status-error);
		font: var(--label);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 620px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
