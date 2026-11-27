<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	import AppSidebar from './AppSidebar.svelte';
	import AppTopBar from './AppTopBar.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const LOGIN_PATH = resolve('/(public)/login');

	// A tela de login é o único ponto sem a barra lateral: o formulário ocupa
	// toda a área de conteúdo.
	const showSidebar = $derived(page.url.pathname !== LOGIN_PATH);

	let isSidebarOpen = $state(false);

	function openSidebar() {
		isSidebarOpen = true;
	}

	function closeSidebar() {
		isSidebarOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeSidebar();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell">
	{#if showSidebar}
		<AppSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
	{/if}

	<div class="app-shell__main">
		<AppTopBar onMenu={openSidebar} showMenu={showSidebar} />

		<div class="app-shell__content">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.app-shell {
		display: flex;
		width: 100%;
		min-height: 100dvh;
	}

	.app-shell__main {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.app-shell__content {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
</style>
