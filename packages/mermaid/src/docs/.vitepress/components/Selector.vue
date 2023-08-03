<template>
  <div>
    <span>{{ title }}</span>
    <button
      class="rounded-full"
      :key="option.value"
      @click="handleButtonClick(option.value)"
      v-for="option in options"
    >
      {{ option.label }}
      <span v-if="option.value === value">[v]</span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    defaultValue: String,
    options: Array,
  },
  data() {
    return {
      value: this.defaultValue,
    };
  },
  methods: {
    handleButtonClick(newValue) {
      this.value = newValue;
      this.$emit('change', this.value);
    },
  },
};
</script>
