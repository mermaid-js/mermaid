<script setup lang="ts">
interface Taglines {
  label: string;
  url: string;
}

const taglines: Taglines[] = [
  {
    label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
    url: 'https://www.mermaidchart.com/landing?utm_source=mermaid_live_editor&utm_medium=banner_ad&utm_campaign=visual_editor',
  },
  {
    label: 'Diagram live with teammates in Mermaid Chart',
    url: 'https://www.mermaidchart.com/landing?utm_source=mermaid_live_editor&utm_medium=banner_ad&utm_campaign=teams',
  },
  {
    label: 'Skip the rough draft with Mermaid AI in Mermaid Chart',
    url: 'https://www.mermaidchart.com/mermaid-ai?utm_source=mermaid_live_editor&utm_medium=banner_ad&utm_campaign=mermaid_ai',
  },
];

const index = Math.floor(Math.random() * taglines.length);
const currentTagline = taglines[index];
</script>

<template>
  <div
    class="mb-4 w-full top-bar bg-gradient-to-r from-[#bd34fe] to-[#ff3670] flex items-center text-center justify-center p-1 text-white"
  >
    <p class="flex-grow text-center tracking-wide text-text">
      <a
        href="{{ currentTagline.url }}"
        target="_blank"
        class="unstyled flex-grow tracking-wide plausible-event-name=bannerClick"
      >
        <span class="text-primary-50 font-semibold">{{ currentTagline.label }}</span>
        <button
          class="ml-4 rounded bg-[#111113] p-1 px-2 text-sm font-semibold tracking-wide text-white"
        >
          Try it now
        </button>
      </a>
    </p>
  </div>
</template>
