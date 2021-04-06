<template>
  <nav id="breadcrumb">
    <ol>
      <li :class="[currentStep === 'Step1' ? 'selected' : 'disabled']">Select an album</li>
      <li :class="[currentStep === 'Step2' ? 'selected' : 'disabled']">Listen and rank</li>
      <li :class="[currentStep === 'Step3' ? 'selected' : 'disabled']">Results</li>
    </ol>
  </nav>
</template>

<script lang="ts">
  import { computed, defineComponent } from "vue";
  import { useStore } from "vuex";

  export default defineComponent({
    name: "Navigation",
    components: {},

    setup() {
      const store = useStore();

      const currentStep = computed(() => store.state.currentStep);

      return {
        currentStep,
      };
    },
  });
</script>
