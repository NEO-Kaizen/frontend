<script lang="ts">
	import { navigating } from '$app/state';

	const DISPLAY_DELAY_MS = 180;

	let isVisible = $state(false);

	$effect(() => {
		if (navigating.to === null) {
			isVisible = false;
			return;
		}

		const timeoutId = window.setTimeout(() => {
			isVisible = true;
		}, DISPLAY_DELAY_MS);

		return () => window.clearTimeout(timeoutId);
	});
</script>

<span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
	{isVisible ? 'Carregando página…' : ''}
</span>

{#if isVisible}
	<div class="navigation-progress" role="progressbar" aria-label="Carregando página">
		<span class="navigation-progress__indicator"></span>
	</div>
{/if}

<style>
	.navigation-progress {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 100;
		width: 100%;
		height: 3px;
		overflow: hidden;
		background-color: var(--white-gray);
		pointer-events: none;
	}

	.navigation-progress__indicator {
		display: block;
		width: 40%;
		height: 100%;
		background-color: var(--primary-color);
		animation: progress 1s ease-in-out infinite;
	}

	@keyframes progress {
		from {
			transform: translateX(-110%);
		}

		to {
			transform: translateX(360%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navigation-progress__indicator {
			width: 100%;
			animation: none;
		}
	}
</style>
