<template>
  <!-- Always reset the text alignment for each statement: https://github.com/ZenUml/core/issues/406
       Set text color to text-skin-base for all messages and allow fragments to override it. -->
  <component
    class="text-left text-sm text-skin-message"
    v-bind:is="subStatement"
    :context="context"
    :comment="comment"
    :commentObj="commentObj"
    :selfCallIndent="selfCallIndent"
  ></component>
</template>

<script>
import Creation from './Creation/Creation.vue';
import Interaction from './Interaction/Interaction.vue';
import InteractionAsync from './InteractionAsync/Interaction-async.vue';
import FragmentAlt from './Fragment/FragmentAlt.vue';
import FragmentPar from './Fragment/FragmentPar.vue';
import FragmentLoop from './Fragment/FragmentLoop.vue';
import FragmentOpt from './Fragment/FragmentOpt.vue';
import FragmentTryCatchFinally from './Fragment/FragmentTryCatchFinally.vue';
import Return from './Return/Return.vue';
import Divider from './Divider/Divider.vue';
import Comment from '../../../../../Comment/Comment';

export default {
  name: 'statement',
  props: ['context', 'selfCallIndent'],
  computed: {
    comment: function () {
      return this.context.getComment() ? this.context.getComment() : '';
    },
    commentObj: function () {
      return new Comment(this.comment);
    },
    subStatement: function () {
      let that = this;
      let dict = {
        loop: 'FragmentLoop',
        alt: 'FragmentAlt',
        par: 'FragmentPar',
        opt: 'FragmentOpt',
        tcf: 'FragmentTryCatchFinally',
        creation: 'Creation',
        message: 'Interaction',
        asyncMessage: 'InteractionAsync',
        divider: 'Divider',
        ret: 'Return',
      };
      let key = Object.keys(dict).find((x) => that.context[x]() !== null);
      return dict[key];
    },
  },
  components: {
    Creation,
    Interaction,
    InteractionAsync,
    FragmentAlt,
    FragmentPar,
    FragmentOpt,
    FragmentTryCatchFinally,
    FragmentLoop,
    Divider,
    Return,
  },
};
</script>
