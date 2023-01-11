<template>
  <div class="block">
    <div class="statement-container mt-1" v-for="(stat, index) in statements" :key="index">
      <statement :context="stat" :selfCallIndent="selfCallIndent" />
    </div>
  </div>
</template>

<script>
import Statement from './Statement/Statement.vue';

export default {
  name: 'block',
  props: ['context', 'selfCallIndent'],
  computed: {
    statements: function () {
      return this.context?.stat();
    },
  },
  components: {
    Statement,
  },
};
</script>
