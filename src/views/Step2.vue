<template>
  <h2>Step 2: listen and rank</h2>
  <p>Selected album: {{ displayTitle }}</p>

  <div id="step2-matchup-container">
    <div>
      <b>Round {{ currentRound }} of {{ totalRounds }}</b>
    </div>

    <div id="step2-matchup-view">
      <div id="step2-matchup-status">
        <h3>Winners</h3>
        <hr />
        <MatchupList :matchups="bracket.currentRound" :winners="winners" v-model:matchup-index="currentMatchupIndex" />
      </div>
      <div id="step2-matchup-current">
        <h3>Matchup {{ currentMatchupIndex + 1 }} of {{ totalMatchups }}</h3>
        <hr />

        <div id="step2-matchup-current-contents">
          <div id="step2-matchup-items">
            <MatchupParticipant
              align="left"
              item-value="left"
              :item="currentMatchupLeft"
              v-model="selectedParticipant"
            />
            <div class="vs">vs.</div>
            <MatchupParticipant
              align="right"
              item-value="right"
              :item="currentMatchupRight"
              v-model="selectedParticipant"
            />
          </div>
        </div>
        <div class="footer-center-container">
          <div class="footer-controls">
            <button @click="cycleMatchup(false)" class="previous">
              <span class="gg-chevron-left"></span> Previous
            </button>
            <button @click="cycleMatchup(true)" class="next"><span class="gg-chevron-right"></span> Next</button>
          </div>
          <button @click="advance()" class="footer-next-round primary-button" :disabled="!canAdvance">
            <template v-if="currentRound !== totalRounds">Next round</template>
            <template v-else>View results</template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref, watch } from "vue";
  import { useStore } from "vuex";
  import MatchupParticipant from "@/components/MatchupParticipant.vue";
  import MatchupList from "@/components/MatchupList.vue";

  export default defineComponent({
    name: "Step2",
    components: { MatchupParticipant, MatchupList },

    setup() {
      const store = useStore();

      const winners = ref<Array<boolean | null>>([]);
      const currentMatchupIndex = ref(0);
      const selectedParticipant = ref<string | null>(null);

      const source = computed(() => store.state.source);
      const bracket = computed(() => store.state.bracket);
      const displayTitle = computed(() => source.value?.displayTitle);
      const currentRound = computed(() => bracket.value.currentRoundIndex + 1);
      const totalRounds = computed(() => bracket.value.totalRounds);
      const participants = computed(() => bracket.value.participantsWithByes);

      const currentMatchup = computed(() => {
        return bracket.value.currentRound[currentMatchupIndex.value];
      });
      const currentMatchupLeft = computed(() => currentMatchup.value?.left);
      const currentMatchupRight = computed(() => currentMatchup.value?.right);
      const currentRoundMatchups = computed(() => bracket.value.currentRound);
      const totalMatchups = computed(
        () =>
          bracket.value.currentRound.filter(
            (m: any) =>
              !Object.prototype.hasOwnProperty.call(m.left, "bye") &&
              !Object.prototype.hasOwnProperty.call(m.right, "bye")
          ).length
      );
      const canAdvance = computed(() => {
        console.log(`computed`);
        const matchups = bracket.value.currentRound;
        console.log(matchups);
        if (!matchups) return false;

        for (let i = 0; i < matchups.length; ++i) {
          const matchup = matchups[i];

          if (
            Object.prototype.hasOwnProperty.call(matchup.left, "bye") ||
            Object.prototype.hasOwnProperty.call(matchup.right, "bye")
          )
            continue;

          console.log(`${i}: ${winners.value[i]}`);
          if (winners.value[i] === null) return false;
        }

        return true;
      });

      const cycleMatchup = (next: boolean) => {
        const matchups = bracket.value.currentRound;

        for (let i = 1; i < matchups.length; ++i) {
          const newIndex = (matchups.length + currentMatchupIndex.value + (next ? i : -i)) % matchups.length;
          const newMatchup = matchups[newIndex];
          if (
            Object.prototype.hasOwnProperty.call(newMatchup.left, "bye") ||
            Object.prototype.hasOwnProperty.call(newMatchup.right, "bye")
          )
            continue;

          currentMatchupIndex.value = newIndex;
          return;
        }
      };

      const onNewRound = () => {
        winners.value = Array(bracket.value.currentRound.length).fill(null);
        currentMatchupIndex.value = 0;
        selectedParticipant.value = null;
      };

      const advance = () => {
        if (bracket.value.winner !== null) return;

        if (bracket.value.nextRound(winners.value).winner) {
          store.commit("gotoStep3");
          return;
        }
        onNewRound();
      };

      onMounted(() => onNewRound());
      watch(source, () => onNewRound());

      watch(currentMatchupIndex, (value) => {
        switch (winners.value[value]) {
          case true:
            selectedParticipant.value = "left";
            break;
          case false:
            selectedParticipant.value = "right";
            break;
          case null:
            selectedParticipant.value = null;
            break;
        }
      });

      watch(selectedParticipant, (value) => {
        switch (value) {
          case "left":
            winners.value[currentMatchupIndex.value] = true;
            break;
          case "right":
            winners.value[currentMatchupIndex.value] = false;
            break;
          default:
            winners.value[currentMatchupIndex.value] = null;
        }
      });

      return {
        winners,
        currentMatchupIndex,
        selectedParticipant,

        source,
        bracket,
        displayTitle,
        currentRound,
        totalRounds,
        totalMatchups,
        participants,
        canAdvance,

        currentMatchup,
        currentRoundMatchups,
        currentMatchupLeft,
        currentMatchupRight,

        cycleMatchup,
        advance,
      };
    },
  });
</script>

<style lang="stylus" scoped>
  @import url("../assets/styles/chevron.css")
  @import "../assets/styles/common.styl"

  .footer-center-container
    display: flex
    flex-direction: row
    justify-content: center
    margin-top: 20px
    position: relative

  .footer-controls
    display: flex
    flex-direction: row

  .footer-controls button
    display: flex
    flex-direction: row
    align-items: center
    width: 100px
    margin: 0 25px

    &.next
      flex-direction row-reverse

  .footer-next-round
    position: absolute
    right: 0
</style>
