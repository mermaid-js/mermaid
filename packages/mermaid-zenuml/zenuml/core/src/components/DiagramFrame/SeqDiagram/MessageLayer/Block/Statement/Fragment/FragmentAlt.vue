<template>
  <div class="fragment alt border-skin-fragment rounded" :style="fragmentStyle">
    <div class="segment">
      <comment v-if="comment" :comment="comment" :commentObj="commentObj"/>

      <div class="header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t">
        <div class="name font-semibold p-1 border-b"><label class="p-0">Alt</label></div>
      </div>
      <div class="segment">
        <div class="text-skin-fragment">
          <label class="condition p-1">[{{condition}}]</label>
        </div>
        <block v-if="blockInIfBlock"
             :style="{paddingLeft: `${offsetX}px`}"
             :context="blockInIfBlock"
             :selfCallIndent="selfCallIndent"
        ></block>
    </div>
    </div>
    <template v-for="(elseIfBlock, index) in alt.elseIfBlock()">
      <div class="segment mt-2 border-t border-solid" :key="index+500">
        <div class="text-skin-fragment" :key="index+1000">
          <label class="else-if hidden">else if</label>
          <label class="condition p-1">[{{conditionFromIfElseBlock(elseIfBlock)}}]</label>
        </div>
        <block :style="{paddingLeft: `${offsetX}px`}"
               :context="blockInElseIfBlock(elseIfBlock)"

               :selfCallIndent="selfCallIndent"
               :key="index+2000"></block>
      </div>
    </template>
    <template v-if="elseBlock">
      <div class="segment mt-2 border-t border-solid">
        <div class="text-skin-fragment"><label class="p-1">[else]</label></div>
        <block :style="{paddingLeft: `${offsetX}px`}"
               :context="elseBlock"
               :selfCallIndent="selfCallIndent"
        ></block>
      </div>
    </template>
  </div>
</template>

<script>
  import fragment from './FragmentMixin'

  export default {
    name: 'fragment-alt',
    props: ['context', 'comment', 'selfCallIndent', 'commentObj'],
    mixins: [fragment],
    computed: {
      from: function() {
        return this.context.Origin()
      },
      alt: function () {
        return this.context.alt()
      },
      blockInIfBlock: function () {
        return this.alt?.ifBlock()?.braceBlock()?.block()
      },
      condition: function () {
        return this.conditionFromIfElseBlock(this.alt?.ifBlock())
      },
      elseBlock: function () {
        return this.alt?.elseBlock()?.braceBlock()?.block()
      }
    },
    methods: {
      conditionFromIfElseBlock(ctx) {
        return ctx?.parExpr()?.condition()?.getFormattedText()
      },
      blockInElseIfBlock(ctx) {
        return ctx?.braceBlock()?.block()
      }
    },
    beforeCreate: function () {
      this.$options.components.Block = require('../../Block.vue').default
      this.$options.components.Comment = require('../Comment/Comment.vue').default
    }
  }
</script>

<style scoped>
  /* We need to do this because tailwind 3.2.4 set border-color to #e5e7eb via '*'. */
  * {
    border-color: inherit;
  }
</style>
