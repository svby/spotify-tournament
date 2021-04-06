<template>
  <OctocatCorner />
  <router-view />
</template>

<script lang="ts">
  import { defineComponent } from "vue";
  import OctocatCorner from "@/components/OctocatCorner.vue";

  export default defineComponent({
    name: "App",
    components: { OctocatCorner },

    setup() {
      return {};
    },
  });
</script>
