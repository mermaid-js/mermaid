<template>
  <div
    class="life-line-layer lifeline-layer absolute h-full flex flex-col pt-8"
    :style="{ 'min-width': '200px' }"
  >
    <div class="container relative grow">
      <life-line
        v-if="starterOnTheLeft"
        :entity="starterParticipant"
        class="starter"
        :class="{ invisible: invisibleStarter }"
      />
      <template v-for="(child, index) in explicitGroupAndParticipants">
        <life-line-group :key="index" v-if="child instanceof GroupContext" :context="child" />
        <life-line
          :key="index"
          v-if="child instanceof ParticipantContext"
          :entity="getParticipantEntity(child)"
        />
      </template>
      <life-line v-for="entity in implicitParticipants" :key="entity.name" :entity="entity" />
    </div>
  </div>
</template>

<script>
import parentLogger from '../../../../logger/logger';
import { GroupContext, ParticipantContext, Participants } from '../../../../parser';
import { mapGetters, mapMutations } from 'vuex';
import LifeLine from './LifeLine.vue';
import LifeLineGroup from './LifeLineGroup.vue';
const logger = parentLogger.child({ name: 'LifeLineLayer' });

export default {
  name: 'life-line-layer',
  props: ['context'],
  computed: {
    ...mapGetters(['participants', 'GroupContext', 'ParticipantContext', 'centerOf']),
    invisibleStarter() {
      return this.starterParticipant.name === '_STARTER_';
    },
    starterParticipant() {
      return this.participants.Starter();
    },
    starterOnTheLeft() {
      return !this.starterParticipant.explicit;
    },
    implicitParticipants() {
      return this.participants.ImplicitArray();
    },
    explicitGroupAndParticipants() {
      return this.context?.children.filter((c) => {
        const isGroup = c instanceof GroupContext;
        const isParticipant = c instanceof ParticipantContext;
        return isGroup || isParticipant;
      });
    },
  },
  methods: {
    ...mapMutations(['increaseGeneration']),
    getParticipantEntity(ctx) {
      return Participants(ctx).First();
    },
  },
  updated() {
    logger.debug('LifeLineLayer updated');
  },
  mounted() {
    logger.debug('LifeLineLayer mounted');
  },
  components: {
    LifeLine,
    LifeLineGroup,
  },
};
</script>
