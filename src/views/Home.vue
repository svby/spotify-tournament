<template>
  <div id="container">
    <div id="content-container">
      <header>
        <router-link to="/"><h1>Spotify bracket</h1></router-link>
        <p>
          Signed in as <span class="username">{{ user?.display_name ?? "unknown" }}</span>
        </p>
      </header>

      <hr />

      <Navigation />

      <div id="step-container">
        <component :is="currentStepComponent" />
      </div>
      <hr />

      <footer>
        <p>© 2021 <a href="https://stuhlmeier.github.io/">stuhlmeier</a></p>
        <p>Made with <a href="https://v3.vuejs.org/">Vue 3</a></p>
        <p>
          Available under the <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">GNU General Public License</a>.
        </p>
      </footer>
    </div>
  </div>

  <ModalDialog :visible="showLoginModal">
    <h1>Sign in to Spotify</h1>
    <p>Click here to sign in with Spotify:</p>
    <button @click="login">Sign in</button>
  </ModalDialog>

  <ModalDialog closeable v-model:visible="showDeviceModal">
    <h1>Choose playback device</h1>
    <p>
      <label for="playbackDevice">Choose a device for playback:</label>
      <select id="playbackDevice" v-model="selectedDeviceId">
        <option v-for="device in validDevices" :key="device.id" :value="device.id">
          {{ device.name }}
        </option>
      </select>
    </p>
    <button @click="activateDeviceAndPlay" :disabled="!playEnabled">Play</button>
  </ModalDialog>
</template>

<script lang="ts">
  import { computed, defineComponent, provide, ref, watch } from "vue";
  import { useStore } from "vuex";

  import Navigation from "@/components/Navigation.vue";
  import Step1 from "./Step1.vue";
  import Step2 from "./Step2.vue";
  import Step3 from "./Step3.vue";
  import ModalDialog from "@/components/ModalDialog.vue";
  import { activateDevice, getDevices, play } from "@/common/spotify";

  export default defineComponent({
    name: "Home",
    components: { ModalDialog, Navigation, Step1, Step2, Step3 },

    setup() {
      const store = useStore();

      const trackToPlay = ref("");
      const devices = ref<Array<any>>([]);
      const validDevices = computed(() => {
        return devices.value.filter((d) => !d.is_restricted);
      });
      const selectedDeviceId = ref("");
      const playEnabled = ref(true);
      const showDeviceModal = ref(false);

      const playTrack = (uri: string) => {
        getDevices(store.state.token).then((data) => {
          trackToPlay.value = uri;
          devices.value = data;
          if (data) {
            selectedDeviceId.value = data[0].id;
          }
          showDeviceModal.value = true;
        });
      };
      provide("playTrack", playTrack);

      watch(showDeviceModal, (value) => {
        if (!value) {
          trackToPlay.value = "";
          devices.value = [];
          playEnabled.value = true;
        }
      });

      const activateDeviceAndPlay = () => {
        playEnabled.value = false;
        activateDevice(store.state.token, selectedDeviceId.value)
          .then(() => {
            return play(store.state.token, trackToPlay.value);
          })
          .then(() => {
            showDeviceModal.value = false;
          });
      };

      const token = computed(() => store.state.token);
      const user = computed(() => store.state.user);

      const updateUser = () => {
        if (!token.value) return;

        return fetch(`https://api.spotify.com/v1/me`, {
          method: "GET",
          headers: new Headers({
            Authorization: `${token.value.tokenType} ${token.value.accessToken}`,
          }),
        })
          .then((data) => data.json())
          .then((data) => {
            if (data.error) throw new Error(data.error.message);
            return data;
          })
          .then((data) => {
            store.commit("setUser", data);
          })
          .catch((error) => {
            alert(`Could not fetch user: ${error}`);
            store.dispatch("getNewToken");
          });
      };

      updateUser();
      watch(token, updateUser);

      const showLoginModal = computed(() => token.value === null);
      const currentStepComponent = computed(() => store.state.currentStep);

      const login = () => store.dispatch("getNewToken");

      return {
        user,

        showLoginModal,
        currentStepComponent,

        trackToPlay,
        validDevices,
        selectedDeviceId,
        playEnabled,
        showDeviceModal,

        activateDeviceAndPlay,

        login,
      };
    },
  });
</script>

<style lang="stylus" scoped>
  @import url("../assets/styles/main.css")
  @import url("../assets/styles/tournament.css")

  header a
    color: inherit
    text-decoration: none

  .username
      font-weight bold

  label
    display: block

  .modal h1
    font-size: 18pt
    margin-top: 0
</style>
