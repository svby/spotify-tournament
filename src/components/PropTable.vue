<template>
  <table>
    <tr v-for="[k, v] in data.entries()" :key="k">
      <th scope="row">{{ k }}</th>
      <td>{{ v }}</td>
    </tr>
  </table>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "PropTable",
    components: {},
    props: {
      data: {
        type: Map,
        required: true,
      },
    },
  });
</script>
