<template>
  <div
    @click.self="$emit('update:modelValue', itemValue)"
    :class="[align, 'step2-item', 'fade', inactive ? 'inactive' : '', selected ? 'selected' : '']"
  >
    <div class="bg"><img :src="image" alt="Cover image" /></div>
    <div class="item-info">
      <p>{{ item.name }}</p>
      <p>{{ artists }}</p>
      <a class="play">Play on Spotify (requires active device)</a>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, toRefs, watch } from "vue";
  import { useStore } from "vuex";

  export default defineComponent({
    name: "MatchupParticipant",
    components: {},
    props: {
      align: {
        type: String,
        required: false,
        default: "left",
      },
      item: {
        type: Object,
        required: false,
        default: () => ({}),
      },
      modelValue: {
        type: String,
        required: false,
        default: null,
      },
      itemValue: {
        type: String,
        required: true,
      },
    },

    setup(props) {
      const store = useStore();
      const { modelValue, itemValue, item } = toRefs(props);

      // TODO: these could probably be computed values
      const inactive = ref(false);
      const selected = ref(false);

      watch(modelValue, (value: string | null) => {
        if (itemValue.value === value) {
          // This participant is selected
          inactive.value = false;
          selected.value = true;
        } else if (value !== null && typeof value !== "undefined") {
          // Another participant is selected
          inactive.value = true;
          selected.value = false;
        } else {
          // No participant is selected
          inactive.value = false;
          selected.value = false;
        }
      });

      const artists = computed(() => {
        return item.value.artists?.map((a: any) => a.name)?.join(", ") ?? "unknown";
      });

      const image = computed(() => {
        return store.state.source?.getTrackImage(item.value) ?? "";
      });

      return {
        inactive,
        selected,

        artists,
        image,
      };
    },
  });
</script>

<style lang="stylus" scoped>
  .left
    text-align: left

  .center
    text-align: center

  .right
    text-align: right
</style>
