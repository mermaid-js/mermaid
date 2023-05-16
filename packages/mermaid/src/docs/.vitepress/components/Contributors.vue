<script setup lang="ts">
import { contributors } from '../contributors';
</script>

<template>
  <div flex="~ wrap gap2" justify-center>
    <a
      v-for="{ name, avatar } of contributors"
      :key="name"
      :href="`https://github.com/${name}`"
      m-0
      rel="noopener noreferrer"
      :aria-label="`${name} on GitHub`"
    >
      <img
        loading="lazy"
        :src="avatar"
        width="50"
        height="50"
        rounded-full
        h-12
        w-12
        :alt="`${name}'s avatar`"
      />
    </a>
  </div>
</template>
