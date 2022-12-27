<template>
  <!-- pb-2 to show the shadow -->
  <div class="container absolute flex flex-col h-full" v-if="entities.length > 0"
       :style="{left: `${left}px`, width: `${right-left}px`}">
    <div class="flex flex-col shadow shadow-slate-500/50 flex-grow">
    <!-- TODO: add group name back later.  -->
<!--      <div class="h-14 absolute" :class="{'-mt-12': !!name}">-->
<!--        <label class="block text-center font-semibold">{{name}}</label>-->
<!--      </div>-->
      <div class="lifeline-group relative flex-grow">
        <life-line v-for="entity in entities"
                   inGroup="true"
                   :key="entity.name"
                   :ref="entity.name"
                   :entity="entity"
                   :group-left="left"/>
      </div>
    </div>
  </div>
</template>

<script>
  import {Participants} from '@/parser'
  import LifeLine from './LifeLine'
  import {mapGetters} from "vuex";
  import WidthProviderOnBrowser from "@/positioning/WidthProviderFunc";
  import {TextType} from "@/positioning/Coordinate";

  export default {
    name: 'lifeline-group',
    props: ['context'],
    computed: {
      ...mapGetters(['centerOf']),
      name() {
        return this.context?.name()?.getFormattedText()
      },
      offset() {
        return 0;
      },
      left() {
        const first = this.entities[0].name;
        const width = Math.max(WidthProviderOnBrowser(first, TextType.ParticipantName), '100');
        return this.centerOf(first) - (width / 2) - 8;
      },
      right() {
        const width = Math.max(WidthProviderOnBrowser(this.entities.slice(-1).name, TextType.ParticipantName), '100');
        const last = this.entities.slice(0).pop().name
        return this.centerOf(last) + (width / 2) + 20;
      },
      entities() {
        return Participants(this.context).Array()
      }
    },
    components: {
      LifeLine
    }
  }
</script>

<style scoped>
</style>
