<template>
  <h2>Step 1: select an album or a playlist</h2>

  <div id="step1-objtype-container">
    <input type="radio" id="objtype1" value="playlist" v-model="objectType" />
    <label for="objtype1">Playlist</label>

    <input type="radio" id="objtype2" value="album" v-model="objectType" />
    <label for="objtype2">Album</label>

    <!--TODO: artists-->
    <!--<input type="radio" id="objtype3" name="objectType" value="artist">-->
    <!--<label for="objtype3">Artist</label>-->
  </div>

  <label for="objectId">{{ promptText }}:</label>
  <br />
  <div>
    <input v-model="objectId" id="objectId" type="text" />
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

    <button @click="advance" class="primary-button">Next</button>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref } from "vue";
  import { useStore } from "vuex";
  import { loadSource, stringToSourceType } from "@/common/spotify";

  import PropTable from "@/components/PropTable.vue";

  export default defineComponent({
    name: "Step1",
    components: { PropTable },

    setup() {
      const store = useStore();

      const objectType = ref("playlist");
      const objectId = ref("");
      const fetchEnabled = ref(true);

      const source = computed(() => store.state.source);
      const promptText = computed(() => stringToSourceType(objectType.value).promptText);
      const tableData = computed(() => source.value?.displayFields ?? new Map());
      const coverImage = computed(() => source.value?.image ?? "");

      const onFetchClicked = () => {
        console.log(`Fetching ${objectId.value}`);
        fetchEnabled.value = false;

        // TODO: add token to Vuex
        const token = JSON.parse(localStorage.getItem("token") ?? "{}");

        loadSource(objectType.value, objectId.value, token)
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
        store.commit("gotoStep2");
      };

      return {
        objectType,
        objectId,
        fetchEnabled,

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
</style>
