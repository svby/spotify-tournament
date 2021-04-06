import { createStore } from "vuex";
import Bracket from "@/common/bracket";

export default createStore({
  state: {
    currentStep: "Step1",
    source: null,
    bracket: new Bracket([]),
  },
  mutations: {
    updateSource(state, newSource) {
      state.source = newSource;
      state.bracket = new Bracket(newSource.tracks);
    },

    gotoStep2(state) {
      if (state.currentStep === "Step1") state.currentStep = "Step2";
    },

    gotoStep3(state) {
      if (state.currentStep === "Step2") state.currentStep = "Step3";
    },
  },
  actions: {},
  modules: {},
});
