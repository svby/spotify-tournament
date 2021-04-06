<template>
  <OctocatCorner />
  <router-view />
</template>

<script lang="ts">
  import { defineComponent } from "vue";
  import { useStore } from "vuex";
  import OctocatCorner from "@/components/OctocatCorner.vue";

  export default defineComponent({
    name: "App",
    components: { OctocatCorner },

    setup() {
      const store = useStore();

      store.dispatch("loadToken");

      return {};
    },
  });
</script>
