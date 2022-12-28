<template>
  <div v-show="debug">
    <div class="flex flex-nowrap m-2 text-sm">
      <div
        class="ml-4 text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-green-200 text-green-700 rounded-sm"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="6" y1="3" x2="6" y2="15"></line>
          <circle cx="18" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="M18 9a9 9 0 0 1-9 9"></path>
        </svg>
        <span class="inline-block px-2">{{ gitBranch }}:{{ commitHash }}</span>
      </div>
    </div>
  </div>
</template>

<script>
const commitHash = 'process.env.VUE_APP_GIT_HASH';
const gitBranch = 'process.env.VUE_APP_GIT_BRANCH';
export default {
  name: 'Debug',
  data() {
    return {
      commitHash,
      gitBranch,
    };
  },
  computed: {
    debug() {
      return !!localStorage.zenumlDebug;
    },
  },
};
</script>
