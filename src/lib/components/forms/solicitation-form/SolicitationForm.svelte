<script lang="ts">
  import StepsFormDemanda from '$lib/components/forms/solicitation-form/StepsForm.svelte'

  let current = $state(1)

  const steps = [
    { id: 1, label: 'Solicitação' },
    { id: 2, label: 'Detalhes' },
    { id: 3, label: 'Revisão' }
  ]
</script>

<StepsFormDemanda {steps} {current} />

<button onclick={() => current--}>Voltar</button>
<button onclick={() => current++}>Próximo</button>