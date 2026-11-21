<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	type Step = {
		id: number;
		label: string;
	};

	interface Props {
		steps: Step[];
		current: number;
		completedSteps?: Set<number>;
		visitedSteps?: Set<number>;
		disabled?: boolean;
		onstepclick?: (stepId: number) => void;
	}

	let {
		steps,
		current,
		completedSteps = new Set(),
		visitedSteps = new Set(),
		disabled = false,
		onstepclick
	}: Props = $props();

	function getStepState(stepId: number): 'completed' | 'current' | 'pending' {
		const isCompleted = completedSteps.has(stepId);
		if (isCompleted && disabled) return 'completed';
		if (stepId === current) return 'current';
		if (isCompleted) return 'completed';
		return 'pending';
	}

	function handleStepClick(stepId: number) {
		if (disabled) return;
		if (visitedSteps.has(stepId)) {
			onstepclick?.(stepId);
		}
	}
</script>

<nav class="stepper" aria-label="Progresso do formulário">
	<ol class="steps-list">
		{#each steps as step, index (step.id)}
			{@const state = getStepState(step.id)}
			{@const isLast = index === steps.length - 1}
			{@const isCompleted = completedSteps.has(step.id)}

			<li
				class="step"
				class:completed={state === 'completed'}
				class:current={state === 'current'}
				class:pending={state === 'pending'}
			>
				<button
					type="button"
					class="step-button"
					class:clickable={!disabled && visitedSteps.has(step.id)}
					onclick={() => handleStepClick(step.id)}
					disabled={disabled || !visitedSteps.has(step.id)}
					aria-current={state === 'current' ? 'step' : undefined}
					aria-label="Etapa {step.id}: {step.label}{isCompleted
						? ' (concluída)'
						: state === 'current'
							? ' (atual)'
							: ''}"
				>
					<span class="circle">
						{#if state === 'completed'}
							<Icon iconName="check" iconSize="sm" />
						{:else}
							<span class="inner-dot"></span>
						{/if}
					</span>
				</button>

				<span class="step-label">{step.label}</span>

				{#if !isLast}
					<span class="connector" class:filled={isCompleted} aria-hidden="true"></span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.stepper {
		width: 100%;
		padding: var(--spacing-sm) 0;
	}

	.steps-list {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		list-style: none;
		padding: 0;
		margin: 0;
		position: relative;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		position: relative;
		flex: 1;
		max-width: 200px;
	}

	.step-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		cursor: default;
		z-index: 1;
	}

	.step-button.clickable {
		cursor: pointer;
	}

	.step-button.clickable:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 50%;
	}

	.circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-default);
		border: 4px solid var(--secondary-color);
		background-color: var(--white);
		color: var(--gray);
	}

	.pending {
		opacity: 0.5;
	}

	.inner-dot {
		width: 17px;
		height: 17px;
		border-radius: 50%;
		background-color: var(--secondary-color);
	}

	.current .step-label {
		color: var(--primary-color);
		font-weight: 700;
	}

	.completed .circle {
		background-color: var(--secondary-color);
		color: var(--on-primary);
		border-color: var(--secondary-color);
	}

	.completed .step-label {
		color: var(--secondary-color);
	}

	.step-label {
		font: var(--label);
		color: var(--gray);
		text-align: center;
		white-space: nowrap;
	}

	.connector {
		position: absolute;
		top: 18px;
		left: calc(50% + 18px);
		width: calc(100% - 36px);
		height: 4px;
		background-color: var(--white-gray);
		transition: var(--transition-default);
	}

	.connector.filled {
		background-color: var(--secondary-color);
	}
</style>
