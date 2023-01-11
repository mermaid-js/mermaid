<template>
  <div
    class="interaction async"
    v-on:click.stop="onClick"
    :data-signature="signature"
    :class="{ 'right-to-left': rightToLeft, highlight: isCurrent }"
    :style="{ width: interactionWidth + 'px', transform: 'translateX(' + translateX + 'px)' }"
  >
    <comment v-if="comment" :comment="comment" />
    <component v-bind:is="invocation" :content="signature" :rtl="rightToLeft" type="async" />
  </div>
</template>

<script type="text/babel">
import Comment from '../Comment/Comment.vue';
import SelfInvocationAsync from './SelfInvocationAsync/SelfInvocation-async.vue';
import Message from '../Message/Message.vue';
import { mapGetters } from 'vuex';
import { CodeRange } from '../../../../../../../parser/CodeRange';

function isNullOrUndefined(value) {
  return value === null || value === undefined;
}

export default {
  name: 'interaction-async',
  props: ['context', 'comment', 'selfCallIndent'],
  computed: {
    ...mapGetters(['distance', 'cursor', 'onElementClick']),
    from: function () {
      return this.context.Origin();
    },
    asyncMessage: function () {
      return this.context?.asyncMessage();
    },
    interactionWidth: function () {
      if (this.isSelf) {
        const leftOfMessage = 100;
        const averageWidthOfChar = 10;
        return averageWidthOfChar * (this.signature?.length || 0) + leftOfMessage;
      }
      return Math.abs(this.distance(this.target, this.source));
    },
    // Both 'left' and 'translateX' can be used to move the element horizontally.
    // Change it to use translate according to https://stackoverflow.com/a/53892597/529187.
    translateX: function () {
      return this.rightToLeft
        ? this.distance(this.target, this.from)
        : this.distance(this.source, this.from);
    },
    rightToLeft: function () {
      return this.distance(this.target, this.source) < 0;
    },
    signature: function () {
      return this.asyncMessage?.content()?.getFormattedText();
    },
    source: function () {
      return this.asyncMessage?.from()?.getFormattedText() || this.from;
    },
    target: function () {
      return this.asyncMessage?.to()?.getFormattedText();
    },
    isCurrent: function () {
      const start = this.asyncMessage.start.start;
      const stop = this.asyncMessage.stop.stop + 1;
      if (isNullOrUndefined(this.cursor) || isNullOrUndefined(start) || isNullOrUndefined(stop))
        return false;
      return this.cursor >= start && this.cursor <= stop;
    },
    isSelf: function () {
      return this.source === this.target;
    },
    invocation: function () {
      return this.isSelf ? 'SelfInvocationAsync' : 'Message';
    },
  },
  methods: {
    onClick() {
      this.onElementClick(CodeRange.from(this.context));
    },
  },
  components: {
    Comment,
    SelfInvocationAsync,
    Message,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.interaction .invisible-occurrence {
  height: 20px;
}

.interaction.async >>> .message {
  width: 100%;
}
</style>
