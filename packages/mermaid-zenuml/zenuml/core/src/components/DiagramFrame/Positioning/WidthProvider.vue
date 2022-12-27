<template>
<div class="invisible">
  <message :content="text" rtl="false" type="sync" />
</div>
</template>

<script>
import Message from "../SeqDiagram/MessageLayer/Block/Statement/Message/Message.vue";
export default {
  name: "WidthProvider",
  components: {Message},
  data: function () {
    return {
      text: 'abcd',
    }
  },
  methods: {
    width: function (text, type) {
      console.log(text, type);
      this.text = text;
      return this.$el.clientWidth;
    },
  },
  mounted() {
    this.$store.state.widthProvider = this;
  }
}
</script>

<style scoped>

</style>
