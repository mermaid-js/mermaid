<template>
  <div class="fragment par border-skin-fragment rounded" :style="fragmentStyle">
    <comment v-if="comment" :comment="comment" />
    <div
      class="header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t"
    >
      <div class="name font-semibold p-1 border-b"><label>Par</label></div>
    </div>
    <block
      :style="{ paddingLeft: `${offsetX}px` }"
      :context="par.braceBlock().block()"
      :selfCallIndent="selfCallIndent"
    ></block>
  </div>
</template>

<script>
import fragment from './FragmentMixin';

export default {
  name: 'fragment-par',
  props: ['context', 'comment', 'selfCallIndent'],
  mixins: [fragment],
  computed: {
    from: function () {
      return this.context.Origin();
    },
    par: function () {
      return this.context.par();
    },
  },
  components: {
    Block: () => import('../../Block.vue'),
    Comment: () => import('../Comment/Comment.vue'),
  },
};
</script>
<style scoped>
/* We need to do this because tailwind 3.2.4 set border-color to #e5e7eb via '*'. */
* {
  border-color: inherit;
}
</style>
<style>
/* Knowledge: Shortcut version `border-top: 1px solid` will reset border-top-color to not specified.
   Then according to the spec, it will use text color for border-top-color.
   https://stackoverflow.com/a/8663547/529187
 */
.fragment.par > .block > .statement-container:not(:first-child) {
  border-top-color: inherit;
  border-top-width: 1px;
  border-top-style: solid;
}
</style>
