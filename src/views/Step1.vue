<template>
  <h2>Step 1: select an album or a playlist</h2>

  <div id="step1-objtype-container">
    <input type="radio" id="objtype1" value="playlist" v-model="objectType" />
    <label for="objtype1">Playlist</label>

    <input type="radio" id="objtype2" value="album" v-model="objectType" />
    <label for="objtype2">Album</label>

    <input type="radio" id="objtype3" value="artist" v-model="objectType" />
    <label for="objtype3">Artist</label>

    <input type="radio" id="objtype4" value="saved" v-model="objectType" />
    <label for="objtype4">Saved songs</label>
  </div>

  <label :class="{ hidden: objectType === 'saved' }" for="objectId">{{ promptText }}:</label>
  <template v-if="objectType === 'saved'">
    <p>
      <i><b>Note</b>: fetching saved songs may take a few minutes!</i>
    </p>
  </template>
  <div>
    <input :class="{ hidden: objectType === 'saved' }" v-model="objectId" id="objectId" type="text" />
    <button @click="onFetchClicked" :disabled="!fetchEnabled" id="fetch">Fetch</button>
  </div>

  <div id="album-info-container" :class="[{ hidden: source === null }]">
    <h3>Object information</h3>
    <div id="album-info-flex">
      <PropTable :data="tableData" />
      <div id="album-image">
        <img :src="coverImage" alt="Cover image" />
      </div>
    </div>

    <p>
      <button :disabled="!canAdvance" @click="advance" class="primary-button">Next</button>
      <span class="diagnostic" v-if="!canAdvance">The selected source must have at least 2 tracks!</span>
    </p>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, watch } from "vue";
  import { useStore } from "vuex";
  import { inferSourceData, loadSource, stringToSourceType } from "@/common/spotify";

  import PropTable from "@/components/PropTable.vue";

  export default defineComponent({
    name: "Step1",
    components: { PropTable },

    setup() {
      const store = useStore();

      const objectType = ref("playlist");
      const objectInput = ref("");
      const fetchEnabled = ref(true);

      const source = computed(() => store.state.source);
      const promptText = computed(() => stringToSourceType(objectType.value).promptText);
      const tableData = computed(() => source.value?.displayFields ?? new Map());
      const coverImage = computed(() => source.value?.image ?? "");

      const inferredSourceData = computed(() => inferSourceData(objectInput.value));
      const canAdvance = computed(() => source.value?.trackCount >= 2);

      watch(inferredSourceData, (value) => {
        if (value.success && value.data?.objectType !== "id") {
          objectType.value = value.data?.objectType ?? "playlist";
        }
      });

      const onFetchClicked = () => {
        fetchEnabled.value = false;

        loadSource(store, objectType.value, objectInput.value)
          .then((source) => {
            if (source.data.error) {
              alert(`Error loading source: ${source.data.error.message}`);
              throw new Error(`Error loading source: ${source.data.error.message}`);
            }
            return source;
          })
          .then((source) => store.commit("updateSource", source))
          .catch((error) => alert(error))
          .finally(() => (fetchEnabled.value = true));
      };

      const advance = () => {
        if (!canAdvance.value) return;
        store.commit("gotoStep2");
      };

      return {
        objectType,
        objectId: objectInput,
        fetchEnabled,

        canAdvance,

        source,
        promptText,
        tableData,
        coverImage,

        onFetchClicked,
        advance,
      };
    },
  });
</script>

<style lang="stylus" scoped>
  @import "../assets/styles/common.styl"

  .hidden
    display: none

  #objectId
    margin-right: 5px

  .diagnostic
    margin-left: 10px
    color: red
</style>
