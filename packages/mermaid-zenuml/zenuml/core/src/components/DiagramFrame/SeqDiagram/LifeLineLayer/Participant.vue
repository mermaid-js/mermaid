<template>
  <!-- Set the background and text color with bg-skin-base and text-skin-base.
       Override background color if it is defined in participant declaration (e.g. A #FFFFFF).
       TODO: Add a default .selected style
   -->
  <div
    class="participant bg-skin-participant border-skin-participant text-skin-participant rounded text-base leading-4 relative flex flex-col justify-center z-10 h-10"
    :class="{ selected: selected, 'border-transparent': !!icon }"
    ref="participant"
    :style="{ backgroundColor: backgroundColor, color: color }"
    @click="onSelect"
  >
    <div
      v-if="!!icon"
      v-html="icon"
      class="absolute left-1/2 transform -translate-x-1/2 -translate-y-full h-8 [&>svg]:w-full [&>svg]:h-full"
      :alt="`icon for ${entity.name}`"
    ></div>
    <!-- Put in a div to give it a fixed height, because stereotype is dynamic. -->
    <div class="h-5 group flex flex-col justify-center">
      <span
        v-if="!!comment"
        class="absolute hidden rounded-lg transform -translate-y-8 bg-gray-400 px-2 py-1 text-center text-sm text-white group-hover:flex"
      >
        {{ comment }}
      </span>
      <label class="interface leading-4" v-if="stereotype">«{{ stereotype }}»</label>
      <label class="name leading-4">{{ entity.label || entity.name }}</label>
    </div>
  </div>
</template>

<script>
import { brightnessIgnoreAlpha, removeAlpha } from '../../../../utils/Color';
import iconPath from '../../Tutorial/Icons';

export default {
  name: 'Participant',
  props: {
    entity: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      color: undefined,
    };
  },
  mounted() {
    this.updateFontColor();
  },
  updated() {
    this.updateFontColor();
  },
  computed: {
    selected() {
      return this.$store.state.selected.includes(this.entity.name);
    },
    stereotype() {
      return this.entity.stereotype;
    },
    comment() {
      return this.entity.comment;
    },
    icon() {
      return iconPath[this.entity.type?.toLowerCase()];
    },
    backgroundColor() {
      // Returning `undefined` so that background-color is not set at all in the style attribute
      try {
        if (!this.entity.color) {
          return undefined;
        }
        // TODO: review this decision later; tinycolor2 should be considered as recommended by openai
        // Remove alpha for such a case:
        // 1. Background color for parent has low brightness (e.g. #000)
        // 2. Alpha is low (e.g. 0.1)
        // 3. Entity background has high brightness (e.g. #fff)
        // If we do not remove alpha, the computed background color will be bright while the perceived brightness is low.
        // This will cause issue when calculating font color.
        return this.entity.color && removeAlpha(this.entity.color);
      } catch (e) {
        return undefined;
      }
    },
  },
  methods: {
    onSelect() {
      this.$store.commit('onSelect', this.entity.name);
    },
    updateFontColor() {
      // Returning `undefined` so that background-color is not set at all in the style attribute
      if (!this.backgroundColor) {
        return undefined;
      }
      let bgColor = window
        .getComputedStyle(this.$refs.participant)
        .getPropertyValue('background-color');
      if (!bgColor) {
        return undefined;
      }
      let b = brightnessIgnoreAlpha(bgColor);
      this.color = b > 128 ? '#000' : '#fff';
    },
  },
};
</script>

<style scoped></style>
