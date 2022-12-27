<template>
  <!-- .zenuml is used to make sure tailwind css takes effect when naked == true;
       .bg-skin-base is repeated because .zenuml reset it to default theme.
   -->
  <div class="zenuml sequence-diagram relative box-border text-left overflow-visible" :style="{width: `${width}px`, paddingLeft: `${paddingLeft}px`}" ref="diagram" >
    <life-line-layer :context="rootContext.head()"/>
    <message-layer :context="rootContext.block()"/>
  </div>
</template>

<script>
  import LifeLineLayer from './LifeLineLayer/LifeLineLayer.vue'
  import MessageLayer from './MessageLayer/MessageLayer.vue'
  import {mapGetters} from 'vuex'
  import {Depth} from "@/parser";
  import {FRAGMENT_LEFT_BASE_OFFSET, FRAGMENT_RIGHT_BASE_OFFSET} from "@/components/DiagramFrame/SeqDiagram/MessageLayer/Block/Statement/Fragment/FragmentMixin";

  export default {
    name: 'seq-diagram',
    components: {
      LifeLineLayer,
      MessageLayer
    },
    computed: {
      ...mapGetters(['rootContext', 'coordinates']),
      width() {
        return this.coordinates.getWidth() + 10 * (this.depth + 1) + FRAGMENT_RIGHT_BASE_OFFSET;
      },
      depth: function () {
        return Depth(this.rootContext)
      },
      paddingLeft: function () {
        return 10 * (this.depth + 1) + FRAGMENT_LEFT_BASE_OFFSET
      },
    },
  }
</script>

<style>
  .sequence-diagram * {
    box-sizing: inherit;
  }

  .sequence-diagram {
    line-height: normal;    /* Reset line-height for the diagram */
  }

  /* .participant is shared by MessageLayer and LifeLineLayer */
  .participant {
    border-width: 2px; /* don't override */
    padding: 8px 4px;
    min-width: 88px;
    max-width: 250px;
    text-align: center;
  }
</style>
