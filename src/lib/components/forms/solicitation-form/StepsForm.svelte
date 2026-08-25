<script lang="ts">
  type Step = {
    id: number
    label: string
  }

  let {
    steps,
    current
  }: {
    steps: Step[]
    current: number
  } = $props()
</script>

<div class="stepper">
  {#each steps as step}
    <div class="step">
      <div class:active={step.id <= current} class="circle">
        {step.id}
      </div>

      <span>{step.label}</span>
    </div>
  {/each}
</div>

<style>
  .stepper {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .circle {
    width: 32px;
    height: 32px;
    border: 2px solid #ccc;
    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .circle.active {
    background: #000;
    color: white;
    border-color: #000;
  }
</style>