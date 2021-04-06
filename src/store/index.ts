import { createStore } from "vuex";
import Bracket from "@/common/bracket";

export default createStore({
  state: {
    currentStep: "Step1",
    source: null,
    bracket: new Bracket([]),
    token: null,
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

    gotoStep2(state) {
      if (state.currentStep === "Step1") state.currentStep = "Step2";
    },

    gotoStep3(state) {
      if (state.currentStep === "Step2") state.currentStep = "Step3";
    },
  },
  actions: {
    fetchToken() {
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

      // TODO: listen to localStorage to avoid refresh?
      window.location.href = authUrl;

      return;
    },
  },
  modules: {},
});
