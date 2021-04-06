<template>
  <ol>
    <li v-for="(matchup, index) in matchups" :key="index">
      <span
        title="This song will enter in round 2"
        class="bye"
        v-if="matchup.left.hasOwnProperty('bye') || matchup.right.hasOwnProperty('bye')"
      ></span>
      <span @click="$emit('update:matchupIndex', index)" :class="[matchupIndex === index ? 'selected' : '']" v-else>
        <template v-if="winners[index] === null">(undecided)</template>
        <template v-else>{{ (winners[index] ? matchup.left : matchup.right).name }}</template>
      </span>
    </li>
  </ol>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "MatchupList",
    components: {},
    props: {
      matchups: {
        type: Array,
        required: true,
      },
      winners: {
        type: Array,
        required: true,
      },
      matchupIndex: {
        type: Number,
        required: false,
      },
    },

    setup() {
      return {};
    },
  });
</script>

<style lang="stylus" scoped>
  li span
    cursor: pointer

  .bye
    cursor: not-allowed

    &:after
      color: darkgray
      content: "(bye matchup)"

  .selected
    font-weight: bold
</style>
