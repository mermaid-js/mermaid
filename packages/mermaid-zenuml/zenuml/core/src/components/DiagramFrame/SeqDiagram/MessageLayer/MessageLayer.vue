<template>
  <!-- pr-24 to give space for the right most participant.
  TODO: we may need to consider the width of self message on right most participant. -->
  <div class="message-layer pt-24 pb-10">
    <block :context="context" :style="{'padding-left': paddingLeft + 'px'}"/>
  </div>
</template>

<script>
import parentLogger from '../../../../logger/logger'

import {mapGetters, mapMutations} from 'vuex'
const logger = parentLogger.child({name: 'MessageLayer'})

  export default {
    name: 'message-layer',
    props: ['context'],
    data() {
      return {
        left: 0,
        right: 0,
        totalWidth: 0
      }
    },
    computed: {
      ...mapGetters(['participants', 'centerOf']),
      paddingLeft() {
        if (this.participants.Array().length >= 1) {
          const first = this.participants.Array().slice(0)[0].name;
          return this.centerOf(first);
        }
        return 0;
      }
    },
    methods: {
      ...mapMutations(['onMessageLayerMountedOrUpdated']),

      participantNames() {
        // According to the doc, computed properties are cached.
        return this.participants.Names()
      },
    },
    // Block is rengered in core.ts. See Occurrence.vue for the reason.
    // components: {
    //   Block
    // },
    updated() {
      logger.debug('MessageLayer updated');
    },
    mounted() {
      logger.debug('MessageLayer mounted');
    },

  }
</script>

<style>
  /* Avoid moving interaction to the left or right with margins.
  We can always assume that an interaction's border is the lifeline.
  Moving content with padding is OK.
  Don't move this to the Interaction component. This is also used by Interaction-async
   */
  .interaction {
    /*Keep dashed or solid here otherwise no space is given to the border*/
    border: dashed transparent;
    /* This border width configuration make sure the content width is
       the same as from the source occurrence's right border to target
       occurrence's left boarder (boarder not inclusive).*/
    border-width: 0 7px;
  }

  .interaction:hover {
    cursor: pointer;
  }

  .message {
    position: relative;   /* positioning Point */
  }

  .message>.name {
    text-align: center;
  }

  .interaction.right-to-left > .occurrence {
    /* InteractionBorderWidth + (OccurrenceWidth-1)/2 */
    left: -14px;               /* overlay occurrence bar on the existing bar. */
  }

  .interaction.self > .occurrence {
    /* width of InteractionBorderWidth 7px + lifeline center 1px */
    left: -8px;               /* overlay occurrence bar on the existing bar. */
    margin-top: -10px;
  }

  .fragment {
    border-width: 1px;
    margin: 8px 0 0 0;
    padding-bottom: 10px;
  }

</style>
