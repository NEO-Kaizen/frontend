<script lang="ts">
	import { tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import { updateRequestStatus } from '$lib/services/status.service';
	import { toastState } from '$lib/states/toast.svelte';
	import type { PortalStatus } from '$lib/types/portal-config';
	import { statusThemeVars } from '$lib/utils/status';
	import {
		emptyStatusChangeDraft,
		STATUS_CHANGE_JUSTIFICATION_MAXLENGTH,
		validateStatusChange
	} from './status-change-validation';

	// Modal do `PATCH /requests/:protocol/status` (§3.3). O pai já aplicou as
	// regras de papel/custódia/terminal (`canChangeStatusRole`) e passou apenas
	// os alvos válidos (`statusChangeTargets`) — aqui só validamos e enviamos.
	interface Props {
		protocol: string;
		currentStatusName: string;
		statuses: PortalStatus[];
		targets: { value: string; label: string }[];
		onSaved: () => void;
		onclose: () => void;
	}

	let { protocol, currentStatusName, statuses, targets, onSaved, onclose }: Props = $props();

	let draft = $state(emptyStatusChangeDraft());
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);
	let submitError = $state<string | null>(null);
	let formRoot = $state<HTMLElement | null>(null);

	const currentTheme = $derived(statusThemeVars(currentStatusName, statuses));

	function handleTargetChange(value: string): void {
		draft.targetStatus = value;
		delete errors['targetStatus'];
		submitError = null;
	}

	function handleJustificationInput(): void {
		delete errors['justification'];
		submitError = null;
	}

	function focusFirstInvalid(): void {
		const target = formRoot?.querySelector<HTMLElement>('[aria-invalid="true"]');
		target?.focus();
	}

	async function handleSubmit(): Promise<void> {
		if (isSaving) return;
		const validation = validateStatusChange(draft, targets);
		errors = validation;
		if (Object.keys(validation).length > 0) {
			tick().then(focusFirstInvalid);
			return;
		}
		isSaving = true;
		submitError = null;
		const result = await updateRequestStatus(protocol, {
			targetStatus: Number(draft.targetStatus),
			justification: draft.justification.trim()
		});
		isSaving = false;
		if (result.ok) {
			toastState.add(`Status alterado para ${result.data.status}.`, 'success');
			onSaved();
			onclose();
		} else {
			submitError = result.error.message;
		}
	}
</script>

<Modal title="Alterar status" {onclose}>
	<div class="status-change" bind:this={formRoot}>
		<div class="current-status">
			<span class="current-label">Status atual</span>
			<span
				class="status-badge"
				style:background-color={currentTheme.bg}
				style:color={currentTheme.color}
				style:border={`1px solid ${currentTheme.border}`}
			>
				{currentStatusName}
			</span>
		</div>

		<FilterSelect
			label="Novo status"
			options={targets}
			value={draft.targetStatus}
			onchange={handleTargetChange}
			placeholder="Selecione"
			disabled={isSaving}
			error={errors['targetStatus'] ?? ''}
		/>

		<Textarea
			label="Justificativa"
			placeholder="Descreva o motivo da alteração de status"
			bind:value={draft.justification}
			maxlength={STATUS_CHANGE_JUSTIFICATION_MAXLENGTH}
			rows={4}
			required
			disabled={isSaving}
			error={errors['justification'] ?? ''}
			oninput={handleJustificationInput}
		/>

		{#if submitError}
			<p class="submit-error" role="alert">{submitError}</p>
		{/if}

		<div class="actions">
			<Button variant="outline-neutral" disabled={isSaving} onclick={onclose}>Cancelar</Button>
			<Button variant="primary" loading={isSaving} onclick={() => void handleSubmit()}>
				Alterar status
			</Button>
		</div>
	</div>
</Modal>

<style>
	.status-change {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.current-status {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.current-label {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--gray);
	}

	.status-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.submit-error {
		margin: 0;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		background: var(--status-red-bg);
		border: 1px solid var(--status-red);
		color: var(--status-red);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}
</style>
