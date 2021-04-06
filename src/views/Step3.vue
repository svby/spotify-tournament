<template>
  <h2>Step 3: results</h2>
  <h3>Your favorite track:</h3>
  <iframe :src="winnerEmbed" width="300" height="380" allowtransparency="true" allow="encrypted-media"></iframe>

  <h3>Your bracket:</h3>
  <BracketDiagram />
</template>

<script lang="ts">
  import { computed, defineComponent } from "vue";
  import { useStore } from "vuex";
  import BracketDiagram from "@/components/BracketDiagram.vue";

  export default defineComponent({
    name: "Step3",
    components: { BracketDiagram },

    setup() {
      const store = useStore();

      const bracket = computed(() => store.state.bracket);
      const winner = computed(() => bracket.value.winner);
      const winnerEmbed = computed(() => {
        if (!winner.value) return "";

        const extUrl = winner.value.external_urls["spotify"];
        const search = "spotify.com/";
        const index = extUrl.indexOf(search) + search.length;

        if (index === -1) return "";
        return `${extUrl.substring(0, index)}embed/${extUrl.substring(index)}`;
      });

      return {
        bracket,
        winner,
        winnerEmbed,
      };
    },
  });
</script>

<style lang="stylus" scoped>
  @import "../assets/styles/common.styl"
</style>
