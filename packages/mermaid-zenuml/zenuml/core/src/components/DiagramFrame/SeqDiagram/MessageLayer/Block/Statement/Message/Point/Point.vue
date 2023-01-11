<template>
  <div
    class="point text-skin-message-arrow"
    :class="{ fill: fill, 'no-fill': !fill, 'right-to-left': rtl }"
  >
    <svg v-if="!rtl" class="arrow stroke-2" height="10" width="10">
      <polyline class="right head fill-current stroke-current" points="0,0 10,5 0,10"></polyline>
    </svg>
    <svg v-if="rtl" class="arrow stroke-2" height="10" width="10">
      <polyline class="left head fill-current stroke-current" points="10,0 0,5 10,10"></polyline>
    </svg>
  </div>
</template>

<script type="text/babel">
export default {
  name: 'point',
  props: ['fill', 'rtl'],
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.no-fill svg.arrow polyline {
  fill: none !important;
}

.async > .message > .point > svg.arrow > polyline {
  fill: none;
}

.right-to-left.point {
  left: 0;
  right: auto;
}
.right-to-left.point > svg > polyline.right {
  display: none;
}

.right-to-left.point > svg > polyline.left {
  display: inline;
}

.point > svg > polyline.left {
  display: none;
}
</style>
