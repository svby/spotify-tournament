<template>
  <div id="container">
    <div id="content-container">
      <header>
        <router-link to="/"><h1>Spotify bracket</h1></router-link>
        <p>Signed in as <span id="username">unknown</span></p>
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
    <div id="modal-container" class="visible">
      <div id="login-modal" class="modal">
        <p>Sign in to Spotify:</p>
        <button id="login-button">Sign in</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted } from "vue";
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

      const currentStepComponent = computed(() => store.state.currentStep);

      let token: any;

      function getTime() {
        return Math.floor(new Date().getTime() / 1000);
      }

      const fetchNewToken = () => {
        const currentLocation = window.location.href.split("?")[0];

        const params = new URLSearchParams([
          ["client_id", "1189301921ea4fd9872c18ce32944382"],
          ["response_type", "token"],
          ["redirect_uri", currentLocation],
          // state,
          ["scope", "playlist-read-private user-modify-playback-state"],
          ["show_dialog", "false"],
        ]);
        const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

        window.location.href = authUrl;
      };

      function tryLoadToken() {
        document.getElementById("modal-container")!.classList.add("visible");

        // Fetch login token if this is a callback
        const pageAnchor = window.location.hash.slice(1);
        if (pageAnchor) {
          console.log("Access token received");
          const newToken: any = {};
          for (const [k, v] of pageAnchor.split("&").map((kv) => kv.split("="))) {
            newToken[k] = v;
          }
          token = Object.freeze(newToken);

          // Store token
          localStorage.setItem("token", JSON.stringify(token));

          // Remove hash
          history.replaceState({}, document.title, ".");
        } else {
          // Fetch from local storage if present
          const saved = localStorage.getItem("token");
          if (saved) {
            const savedToken = JSON.parse(saved);
            if (savedToken.expires_in < getTime()) {
              token = savedToken;
            }
          }
        }

        if (token) {
          const username = document.querySelector("#username");
          fetch(`https://api.spotify.com/v1/me`, {
            method: "GET",
            headers: new Headers({
              Authorization: `${token.token_type} ${token.access_token}`,
            }),
          })
            .then((data) => data.json())
            .then((data) => {
              if (data.error) {
                alert(`Error: ${data.error.message}`);
                if (data.error.message.includes("token expire")) {
                  localStorage.removeItem("token");
                  token = null;
                  tryLoadToken();
                } else {
                  alert(`Couldn't fetch user information: ${data.error.message}`);
                }
                return;
              }
              username!.textContent = data.display_name;
            });

          // Hide login modal
          document.getElementById("modal-container")!.classList.remove("visible");
        }
      }

      onMounted(() => {
        const loginButton = document.getElementById("login-button");
        loginButton!.addEventListener("click", () => fetchNewToken());
        tryLoadToken();
      });

      return {
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
</style>
