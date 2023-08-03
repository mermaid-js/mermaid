<script setup>
const { selectedPlatform } = defineProps(['selectedPlatform']);
const emit = defineEmits();
const handlePlatformChange = (newPlatform) => {
  emit('change', newPlatform);
};
</script>

<style>
.platform-button {
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  border: 1px solid transparent;
  border-color: var(--vp-button-alt-border);
  color: var(--vp-button-alt-text);
  background-color: var(--vp-button-alt-bg);
}

.platform-button:hover {
  border-color: var(--vp-button-alt-hover-border);
  color: var(--vp-button-alt-hover-text);
  background-color: var(--vp-button-alt-hover-bg);
}

.platform-button--selected {
  border-color: var(--vp-button-brand-border);
  color: var(--vp-button-brand-text);
  background-color: var(--vp-button-brand-bg);
}

.platform-button--selected:hover {
  border-color: var(--vp-button-brand-hover-border);
  color: var(--vp-button-brand-hover-text);
  background-color: var(--vp-button-brand-hover-bg);
}
</style>

<template>
  <div class="platform space-x-2 flex rounded-lg items-center">
    <p class="font-semibold">Platform:</p>
    <button
      class="platform-button font-semibold rounded-full px-4 py-1"
      :class="{ 'platform-button--selected': selectedPlatform === 'native' }"
      @click="handlePlatformChange('native')"
    >
      Native
    </button>
    <button
      class="platform-button font-semibold rounded-full px-4 py-1"
      :class="{ 'platform-button--selected': selectedPlatform === 'docker' }"
      @click="handlePlatformChange('docker')"
    >
      Docker
    </button>
  </div>
</template>
