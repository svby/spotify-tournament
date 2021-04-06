<template>
  <div id="container">
    <div id="content-container">
      <header>
        <router-link to="/"><h1>Spotify bracket</h1></router-link>
        <p>
          Signed in as <span class="username">{{ username }}</span>
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
  import { computed, defineComponent, onMounted, ref, watch } from "vue";
  import { useStore } from "vuex";

  import Navigation from "@/components/Navigation.vue";
  import Step1 from "./Step1.vue";
  import Step2 from "./Step2.vue";
  import Step3 from "./Step3.vue";

  import { getTime } from "@/common/util";

  export default defineComponent({
    name: "Home",
    components: { Navigation, Step1, Step2, Step3 },

    setup() {
      const store = useStore();
      const token = computed(() => store.state.token);

      const showLoginModal = ref(false);
      onMounted(() => {
        const savedToken = localStorage.getItem("token");
        const pageFragment = window.location.hash.slice(1);

        let tokenRetrieved = false;
        if (savedToken) {
          const parsedToken = Object.freeze(JSON.parse(savedToken));

          if ((Number(parsedToken.expiresAt) | 0) > getTime() - 10) {
            // Token should still be valid
            store.commit("setToken", {
              token: parsedToken,
              save: false,
            });
            tokenRetrieved = true;
          }
        }

        if (!tokenRetrieved) {
          if (pageFragment) {
            // Try to obtain new token from URL fragment
            const fragmentParams = new Map<string, string>();
            for (const [key, value] of pageFragment.split("&").map((kv) => kv.split("=")))
              fragmentParams.set(key, value);

            const newToken = Object.freeze({
              accessToken: fragmentParams.get("access_token"),
              tokenType: fragmentParams.get("token_type"),
              expiresAt: getTime() + Number(fragmentParams.get("expires_in")),
            });

            // Store token
            localStorage.setItem("token", JSON.stringify(newToken));

            // Remove hash
            history.replaceState({}, document.title, ".");
          } else {
            // No token, show modal
            showLoginModal.value = true;
          }
        }
      });

      const user = ref<any | null>(null);
      const username = computed(() => user.value?.display_name ?? "unknown");
      const login = () => {
        store.dispatch("fetchToken");
      };

      const currentStepComponent = computed(() => store.state.currentStep);

      watch(token, (value) => {
        if (value) {
          fetch(`https://api.spotify.com/v1/me`, {
            method: "GET",
            headers: new Headers({
              Authorization: `${token.value.tokenType} ${token.value.accessToken}`,
            }),
          })
            .then((data) => data.json())
            .then((data) => {
              if (data.error) {
                alert(`Error: ${data.error.message}`);
                if (data.error.message.includes("token expire")) {
                  store.commit("setToken", { token: null, save: true });
                  showLoginModal.value = true;
                } else {
                  alert(`Couldn't fetch user information: ${data.error.message}`);
                }
                return;
              }

              user.value = data;
            });
        }
      });

      return {
        showLoginModal,

        user,
        username,
        login,

        currentStepComponent,
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
