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

    <!-- TODO: improve modal -->
    <div id="modal-container" :class="[showLoginModal ? 'visible' : '']">
      <div id="login-modal" class="modal">
        <p>Sign in to Spotify:</p>
        <button @click="login" id="login-button">Sign in</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, watch } from "vue";
  import { useStore } from "vuex";

  import Navigation from "@/components/Navigation.vue";
  import Step1 from "./Step1.vue";
  import Step2 from "./Step2.vue";
  import Step3 from "./Step3.vue";

  export default defineComponent({
    name: "Home",
    components: { Navigation, Step1, Step2, Step3 },

    setup() {
      const store = useStore();

      const token = computed(() => store.state.token);

      const user = ref(null);
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
            user.value = data;
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

        login,
      };
    },
  });
</script>

<style lang="stylus">
  @import url("../assets/styles/main.css")
  @import url("../assets/styles/tournament.css")

  header a
    color: inherit
    text-decoration: none

  .username
    font-weight bold
</style>
