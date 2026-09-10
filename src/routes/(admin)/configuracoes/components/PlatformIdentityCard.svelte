<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';
	import Input from '$lib/components/Input.svelte';
</script>

<SettingsCard
	iconName="description"
	title="2. Identidade da plataforma"
	description="Defina o nome exibido e a máscara de protocolo."
>
	<Input label="Nome da plataforma" value="NEO" />
	<Input label="Máscara de protocolo" value="MAAT-2026-000000" />
</SettingsCard>
