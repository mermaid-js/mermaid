<template>
  <div class="title text-skin-title text-base font-semibold">{{title}}</div>
</template>

<script>
export default {
  name: 'DiagramTitle',
  props: ['context'],
  computed: {
    title: function () {
      return this.context?.content()
    }
  }
}
</script>

<style scoped>
</style>
