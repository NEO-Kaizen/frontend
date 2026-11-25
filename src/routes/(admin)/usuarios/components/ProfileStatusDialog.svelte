<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { Profile } from '$lib/types/profile';
	import { profileStatusRestriction } from '$lib/utils/profile-status';

	interface Props {
		profile: Profile;
		isChangingStatus: boolean;
		statusError: string;
		onclose: () => void;
		onconfirm: () => void;
	}

	let { profile, isChangingStatus, statusError, onclose, onconfirm }: Props = $props();

	const restriction = $derived(profileStatusRestriction(profile, { canEdit: true }));
</script>

<Modal title={profile.isActive ? 'Desativar perfil' : 'Ativar perfil'} {onclose}>
	<div class="confirm-content">
		{#if profile.isActive && restriction.blocked}
			<p>{restriction.dialogMessage}</p>
		{:else}
			<p>
				{profile.isActive
					? `Ao desativar, "${profile.name}" não poderá ser atribuído a usuários.`
					: `O perfil "${profile.name}" ficará disponível para atribuição.`}
				Confirmar?
			</p>
		{/if}
		{#if statusError}
			<p class="form-error" role="alert">{statusError}</p>
		{/if}
		<div class="modal-actions">
			<Button variant="outline-neutral" disabled={isChangingStatus} onclick={onclose}>
				Cancelar
			</Button>
			{#if !restriction.blocked}
				<Button variant="primary" loading={isChangingStatus} onclick={onconfirm}>
					{profile.isActive ? 'Desativar' : 'Ativar'}
				</Button>
			{/if}
		</div>
	</div>
</Modal>

<style>
	.confirm-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
	.confirm-content p {
		margin: 0;
	}
	.form-error {
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		background: var(--status-error-bg);
		color: var(--status-red);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-md);
		border-top: var(--border-default);
	}
</style>
