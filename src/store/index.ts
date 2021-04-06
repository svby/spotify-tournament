import { createStore } from "vuex";
import Bracket from "@/common/bracket";
import { getTime } from "@/common/util";

export default createStore({
  state: {
    currentStep: "Step1",
    source: null,
    bracket: new Bracket([]),
    token: null,
    user: null,
  },
  mutations: {
    updateSource(state, newSource) {
      state.source = newSource;
      state.bracket = new Bracket(newSource.tracks);
    },

    setToken(state, payload: { token: any | null; save: boolean }) {
      state.token = payload.token;
      if (payload.save) {
        if (payload.token) {
          localStorage.setItem("token", JSON.stringify(payload.token));
        } else localStorage.removeItem("token");
      }
    },

    setUser(state, user) {
      state.user = user;
    },

    gotoStep2(state) {
      if (state.currentStep === "Step1") state.currentStep = "Step2";
    },

    gotoStep3(state) {
      if (state.currentStep === "Step2") state.currentStep = "Step3";
    },
  },
  actions: {
    loadToken(context) {
      const savedToken = localStorage.getItem("token");
      const pageFragment = window.location.hash.slice(1);

      if (savedToken) {
        const parsedToken = Object.freeze(JSON.parse(savedToken));

        if ((Number(parsedToken.expiresAt) | 0) > getTime() - 10) {
          // Token should still be valid
          context.commit("setToken", {
            token: parsedToken,
            save: false,
          });
          return;
        }
      }

      if (pageFragment) {
        // Try to obtain new token from URL fragment
        const fragmentParams = new Map<string, string>();
        for (const [key, value] of pageFragment.split("&").map((kv) => kv.split("="))) fragmentParams.set(key, value);

        const newToken = Object.freeze({
          accessToken: fragmentParams.get("access_token"),
          tokenType: fragmentParams.get("token_type"),
          expiresAt: getTime() + Number(fragmentParams.get("expires_in")),
        });

        // Store token
        context.commit("setToken", { token: newToken, save: true });

        // Remove hash
        setTimeout(() => {
          history.replaceState({}, document.title, ".");
        }, 0);
      } else {
        // No token
      }
    },

    getNewToken(context) {
      // Remove old token
      context.commit("setToken", { token: null, save: true });

      const currentLocation = window.location.href.split("?")[0];

      const params = new URLSearchParams([
        ["client_id", "1189301921ea4fd9872c18ce32944382"],
        ["response_type", "token"],
        ["redirect_uri", currentLocation],
        // state,
        ["scope", "playlist-read-private user-library-read user-modify-playback-state"],
        ["show_dialog", "false"],
      ]);
      const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

      // TODO: listen to localStorage to avoid refresh?
      window.location.href = authUrl;

      return;
    },
  },
  modules: {},
});
