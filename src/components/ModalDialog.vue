<template>
  <div @click.self="onClick" class="modal-container" v-if="visible">
    <div class="modal">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "ModalDialog",
    components: {},
    props: {
      visible: {
        type: Boolean,
        required: false,
        default: true,
      },
      closeable: {
        type: Boolean,
        required: false,
        default: false,
      },
    },

    setup(props, { emit }) {
      const onClick = () => {
        if (props.closeable) {
          emit("update:visible", false);
        }
      };

      return {
        onClick,
      };
    },
  });
</script>

<style lang="stylus" scoped>
  .modal-container
    position: fixed
    z-index: 1
    left: 0
    top: 0
    width: 100vw
    height: 100vh

    display: flex
    flex-direction: column
    align-items: center
    justify-content: center

    background-color: rgba(1, 1, 1, 0.2)
    backdrop-filter: blur(8px)

  .modal
    max-width: 500px
    min-width: 300px

    border-radius: 3px
    border: 1px solid gray
    background: white

    padding: 15px
</style>
