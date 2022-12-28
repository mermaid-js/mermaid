<template>
  <div
    class="interaction sync inline-block"
    v-on:click.stop="onClick"
    :data-to="to"
    data-type="interaction"
    :data-signature="signature"
    :class="{ highlight: isCurrent, self: isSelf }"
    :style="{
      width: !isSelf && interactionWidth + 'px',
      transform: 'translateX(' + translateX + 'px)',
    }"
  >
    <!--Known limitation: `if(x) { m }` not showing source occurrence. -->
    <div
      v-if="(showStarter && isRootBlock) || outOfBand"
      class="occurrence source border-2"
      :class="{ 'right-to-left': rightToLeft }"
    ></div>
    <comment v-if="hasComment" :commentObj="commentObj" />
    <component
      v-bind:is="invocation"
      class="text-center"
      :color="color"
      :content="signature"
      :assignee="assignee"
      :rtl="rightToLeft"
      type="sync"
    ></component>
    <occurrence
      :context="message"
      :participant="to"
      :selfCallIndent="passOnOffset"
      :rtl="rightToLeft"
    />
    <message
      class="return transform -translate-y-full"
      v-if="assignee && !isSelf"
      :content="assignee"
      :rtl="!rightToLeft"
      type="return"
    />
  </div>
</template>

<script type="text/babel">
import Comment from '../Comment/Comment.vue';
import Occurrence from './Occurrence/Occurrence.vue';
import Message from '../Message/Message.vue';
import { mapGetters } from 'vuex';
import SelfInvocation from './SelfInvocation/SelfInvocation.vue';
import { CodeRange } from '../../../../../../../parser/CodeRange';
import { ProgContext } from '../../../../../../../parser';

export default {
  name: 'interaction',
  props: ['context', 'selfCallIndent', 'commentObj'],
  computed: {
    // add tracker to the mapGetters
    ...mapGetters(['participants', 'distance2', 'cursor', 'onElementClick']),
    hasComment() {
      return this.commentObj?.text !== '' || this.commentObj?.color !== '';
    },
    color() {
      return this.commentObj?.color;
    },
    message: function () {
      return this.context?.message();
    },
    providedFrom: function () {
      return this.context?.message()?.ProvidedFrom();
    },
    from: function () {
      return this.providedFrom || this.origin;
    },
    outOfBand: function () {
      return !!this.providedFrom && this.providedFrom !== this.origin;
    },
    assignee: function () {
      let assignment = this.message?.Assignment();
      if (!assignment) return '';
      return assignment.getText();
    },
    signature: function () {
      return this.message?.SignatureText();
    },
    translateX: function () {
      const fragmentOff = 0 || 0;
      // ** Starting point is always the center of 'origin' **
      // Normal flow
      if (!this.rightToLeft && !this.outOfBand) {
        return fragmentOff;
      }

      const moveTo = !this.rightToLeft ? this.providedFrom : this.to;
      const dist = this.distance2(this.origin, moveTo);
      const indent = this.selfCallIndent || 0;
      return dist + fragmentOff - indent;
    },
    rightToLeft: function () {
      return this.distance2(this.from, this.to) < 0;
    },
    isCurrent: function () {
      return this.message?.isCurrent(this.cursor);
    },
    showStarter() {
      return this.participants.Starter().name !== '_STARTER_';
    },
    isRootBlock() {
      return this.context?.parentCtx?.parentCtx instanceof ProgContext;
    },
    origin: function () {
      return this.context?.Origin();
    },
    passOnOffset: function () {
      // selfCallIndent is introduced for sync self interaction. Each time we enter a self sync interaction the selfCallIndent
      // increases by 6px (half of the width of an execution bar). However, we set the selfCallIndent back to 0 when
      // it enters a non-self sync interaction.
      return this.isSelf ? (this.selfCallIndent || 0) + 6 : 0;
    },
    interactionWidth: function () {
      if (this.context && this.isSelf) {
        return 0;
      }

      let safeOffset = this.outOfBand ? 0 : this.selfCallIndent || 0;
      return Math.abs(this.distance2(this.from, this.to) - safeOffset);
    },
    to: function () {
      return this.context?.message()?.Owner();
    },
    isSelf: function () {
      return this.to === this.from;
    },
    invocation: function () {
      // return 'Message'
      return this.isSelf ? 'SelfInvocation' : 'Message';
    },
  },
  methods: {
    onClick() {
      this.onElementClick(CodeRange.from(this.context));
    },
  },
  components: {
    Message,
    SelfInvocation,
    Comment,
    Occurrence,
  },
};
</script>
<style scoped>
.interaction .occurrence.source {
  position: absolute;
  height: calc(100% + 14px);
  left: -12px;
  display: none;
}

.interaction .occurrence.source.right-to-left {
  left: unset;
  right: -13px;
}
</style>
