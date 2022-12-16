<template>
  <div class="occurrence border-skin-occurrence bg-skin-occurrence rounded-sm border-2 relative left-full" :class="{'right-to-left': rtl}" data-el-type="occurrence" :data-belongs-to="participant" :data-x-offset="center" :data-debug-center-of="computedCenter">
    <block v-if="this.context.braceBlock()"
           :context="context.braceBlock().block()"
           :selfCallIndent="selfCallIndent"
    ></block>
  </div>
</template>

<script type="text/babel">
import {mapState, mapGetters} from 'vuex'

  export default {
    name: 'occurrence',
    props: ['context', 'selfCallIndent', 'participant', 'rtl'],
    data: function () {
      return {
        center: 0,
      }
    },
    computed: {
      ...mapGetters(['centerOf', 'messageLayerLeft']),
      ...mapState(['code']),
      computedCenter: function () {
        try {
          return this.centerOf(this.participant)
        } catch (e) {
          console.error(e)
          return 0
        }
      },
    },
    components: {
      Block: () => import('../../../Block')
    },
  }
</script>

<style scoped>

  .occurrence {
    width: 15px;
    /* 5 = (OccurrenceWidth(15)-1)/2 - OccurrenceBorderWidth(2)*/
    padding: 16px 0 16px 5px;
  }


  >>> >.statement-container:last-child>.interaction.return:last-of-type {
    margin-bottom: 0;
    border-bottom: 0;
    transform: translateY(1px);
  }

  >>> >.statement-container:last-child>.interaction.return:last-of-type>.message {
    bottom: -17px; /* Move the absolutely positioned return message to the bottom. -17 to offset the padding of Occurrence. */
    height: 0;
  }

  .right-to-left.occurrence {
    left: -14px;
  }
</style>

<style>
  .occurrence {
    margin-top: -2px; /* To offset Message's border-bottom width */
  }
</style>
