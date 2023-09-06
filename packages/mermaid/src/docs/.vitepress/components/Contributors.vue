<script setup lang="ts">
import { contributors } from '../contributors';
</script>

<template>
  <div flex="~ wrap gap2" justify-center>
    <a
      v-for="{ username, avatar } of contributors"
      :key="username"
      :href="`https://github.com/${username}`"
      m-0
      rel="noopener noreferrer"
      :aria-label="`${username} on GitHub`"
    >
      <img
        loading="lazy"
        :src="avatar"
        width="50"
        height="50"
        rounded-full
        h-12
        w-12
        :alt="`${username}'s avatar`"
      />
    </a>
  </div>
</template>
