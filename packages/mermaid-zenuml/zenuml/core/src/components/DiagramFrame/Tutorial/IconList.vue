<template>
  <ul role="list" class="mt-3 grid grid-cols-4 gap-5 sm:gap-6 sm:grid-cols-6 lg:grid-cols-8">
    <li v-for="type in types" :key="type" class="col-span-1 flex flex-col shadow-sm rounded-md">
      <div
        class="h-12 flex items-center justify-center bg-gray-50 text-white text-sm font-medium rounded-t-md"
      >
        <i
          v-if="!!icon"
          v-html="icon(type)"
          class="object-contain h-8 w-8 m-auto [&>svg]:w-full [&>svg]:h-full"
          :alt="`icon for ${type}`"
        ></i>
      </div>
      <div
        class="flex items-center justify-center border-t border-r border-b border-gray-200 bg-white rounded-b-md"
      >
        <div class="px-2 py-2 text-xs">
          <span class="text-gray-900 font-medium hover:text-gray-600">@{{ type }}</span>
        </div>
      </div>
    </li>
  </ul>
</template>

<script>
import iconPath from './Icons';
export default {
  name: 'IconList',
  props: ['types'],
  computed: {},
  methods: {
    icon(type) {
      return iconPath[type?.toLowerCase()];
    },
  },
};
</script>

<style scoped></style>
