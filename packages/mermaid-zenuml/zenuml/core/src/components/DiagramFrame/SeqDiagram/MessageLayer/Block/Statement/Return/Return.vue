<template>
  <!-- .relative to allow left style -->
  <div class="interaction return relative"
       v-on:click.stop="onClick"
       :data-signature="signature"
       :class="{ 'right-to-left':rightToLeft, 'highlight': isCurrent }"
       :style="{width: width + 'px', left: left + 'px'}">
    <comment v-if="comment" :comment="comment"/>
    <div v-if="isSelf" class="flex items-center">
      <svg class="w-3 h-3 flex-shrink-0 fill-current m-1" viewBox="0 0 512 512"><path class="cls-1" d="M256 0C114.84 0 0 114.84 0 256s114.84 256 256 256 256-114.84 256-256S397.16 0 256 0Zm0 469.33c-117.63 0-213.33-95.7-213.33-213.33S138.37 42.67 256 42.67 469.33 138.37 469.33 256 373.63 469.33 256 469.33Z"/><path class="cls-1" d="M288 192h-87.16l27.58-27.58a21.33 21.33 0 1 0-30.17-30.17l-64 64a21.33 21.33 0 0 0 0 30.17l64 64a21.33 21.33 0 0 0 30.17-30.17l-27.58-27.58H288a53.33 53.33 0 0 1 0 106.67h-32a21.33 21.33 0 0 0 0 42.66h32a96 96 0 0 0 0-192Z"/></svg>
      <span class="name text-sm">{{signature}}</span>
    </div>
    <Message v-if="!isSelf"
        :content="signature"
        :rtl="rightToLeft"
        type="return" />
  </div>
</template>

<script type="text/babel">
  // Return is defined with `RETURN expr? SCOL?` or `ANNOTATION_RET asyncMessage EVENT_END?`.
  // It is rare that you need the latter format. Probably only when you have two consecutive returns.
  import Comment from '../Comment/Comment.vue'
  import Message from '../Message/Message'
  import {mapGetters} from "vuex";
  import {CodeRange} from '@/parser/CodeRange'
  import WidthProviderOnBrowser from "@/positioning/WidthProviderFunc";
  import {TextType} from "@/positioning/Coordinate";
  export default {
    name: 'return',
    props: ['context', 'comment'],
    computed: {
      ...mapGetters(['distance', 'cursor', 'onElementClick']),
      from: function() {
        return this.context.Origin()
      },
      asyncMessage: function () {
        return this.context?.ret().asyncMessage()
      },
      width: function () {
        return this.isSelf? WidthProviderOnBrowser(this.signature, TextType.MessageContent) : Math.abs(this.distance(this.target, this.source))
      },
      left: function () {
        return this.rightToLeft ? (this.distance(this.target, this.from) + 2): (this.distance(this.source, this.from) + 2)
      },
      rightToLeft: function () {
        return this.distance(this.target, this.source) < 0
      },
      signature: function () {
        return this.asyncMessage?.content()?.getFormattedText() || this.context?.ret()?.expr()?.getFormattedText()
      },
      source: function () {
        return this.asyncMessage?.from()?.getFormattedText() || this.from
      },
      target: function () {
        return this.asyncMessage?.to()?.getFormattedText() || this.context?.ret()?.ReturnTo()
      },
      isCurrent: function () {
        return false
      },
      isSelf: function () {
        return this.source === this.target
      },
    },
    methods: {
      onClick() {
        this.onElementClick(CodeRange.from(this.context))
      },
    },
    components: {
      Comment,
      Message
    }
  }
</script>
