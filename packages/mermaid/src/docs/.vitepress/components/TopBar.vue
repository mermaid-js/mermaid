<template>
  <div
    class="w-full top-bar bg-gradient-to-r from-[#bd34fe] to-[#ff3670] flex items-center text-center justify-center p-1 text-white"
  >
    <p class="flex-grow text-center tracking-wide text-text">
      <a
        href="https://www.mermaidchart.com/landing"
        target="_blank"
        class="unstyled flex-grow tracking-wide plausible-event-name=bannerClick"
      >
        <span class="text-primary-50 font-semibold">{{
          [
            'Try diagramming with ChatGPT at Mermaid Chart',
            'Try Mermaid’s Visual Editor at Mermaid Chart',
            'Enjoy live collaboration with teammates at Mermaid Chart',
          ][Math.floor(Math.random() * 3)]
        }}</span>
        <button
          class="ml-4 rounded bg-[#111113] p-1 px-2 text-sm font-semibold tracking-wide text-white"
        >
          Try it now
        </button>
      </a>
    </p>
  </div>
</template>
