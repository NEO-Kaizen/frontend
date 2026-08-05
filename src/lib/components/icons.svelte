<script lang="ts">
	import { iconDictionary, type IconName, type IconSize } from "$lib/types/icons";

    // No futuro carregar apenas os icones que usamos
    
    interface Props{
        iconName : IconName;
        iconSize? : IconSize
    }
    
    const {iconName, iconSize = 'md'}: Props = $props()
    
</script>

<span class="material-symbols-outlined {iconSize}" aria-hidden="true">
    {iconDictionary[iconName]}
</span>

<style>
    /* Mudar quando tiver o design system*/
    .sm {font-size: 16px;}
    .md {font-size: 20px;}
    .lg {font-size: 24px;}
</style>