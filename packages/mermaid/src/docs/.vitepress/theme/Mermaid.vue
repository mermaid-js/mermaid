<template>
  <div ref="diagram" class="mermaid-diagram" :class="{ pending: !svg }" v-html="svg"></div>
  <component :is="props.collapsed ? 'details' : 'div'" v-if="props.showCode">
    <summary v-if="props.collapsed">Code</summary>
    <h5 v-else>Code:</h5>
    <div class="language-mermaid">
      <button class="copy"></button>
      <span class="lang">mermaid</span>
      <pre><code :contenteditable="contentEditable" @input="updateCode"  @keydown.meta.enter="renderChart" @keydown.ctrl.enter="renderChart" class="editable-code">{{ initialCode }}</code></pre>
      <div class="buttons-container">
        <span>{{ ctrlSymbol }} + Enter</span><span>|</span>
        <button @click="renderChart">Run ▶</button>
      </div>
    </div>
  </component>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { render } from './mermaid';
import { buildExampleConfig } from './exampleConfig';
import { watchColorScheme } from './colorScheme';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/400-italic.css';
import '@fontsource-variable/recursive/index.css';

const props = defineProps({
  graph: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  showCode: {
    type: Boolean,
    default: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const svg = ref('');
const initialCode = decodeURIComponent(props.graph);
const code = ref(initialCode);
const ctrlSymbol = ref('Ctrl');
const contentEditable = ref('plaintext-only');
const diagram = ref(null);

let stopWatching = null;
let observer = null;

const updateCode = (event) => {
  code.value = event.target.innerText;
};

onMounted(async () => {
  if (navigator.platform.includes('Mac')) {
    ctrlSymbol.value = '⌘';
  }
  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    contentEditable.value = 'true';
  }
  stopWatching = watchColorScheme(() => {
    if (svg.value) {
      void renderChart();
    }
  });

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect();
        observer = null;
        void renderFirstTime();
      }
    },
    { rootMargin: '1000px 0px' }
  );
  observer.observe(diagram.value);
});

onUnmounted(() => {
  stopWatching?.();
  observer?.disconnect();
});

const renderFirstTime = async () => {
  await renderChart();

  //refresh images on first render
  const hasImages = /<img([\w\W]+?)>/.exec(code.value)?.length > 0;
  if (hasImages)
    setTimeout(() => {
      let imgElements = document.getElementsByTagName('img');
      let imgs = Array.from(imgElements);
      if (imgs.length) {
        Promise.all(
          imgs
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise((resolve) => {
                  img.onload = img.onerror = resolve;
                })
            )
        ).then(() => {
          renderChart();
        });
      }
    }, 100);
};

const renderChart = async () => {
  const hasDarkClass = document.documentElement.classList.contains('dark');
  const mermaidConfig = buildExampleConfig(code.value, hasDarkClass);
  let svgCode = await render(props.id, code.value, mermaidConfig);
  // This is a hack to force v-html to re-render, otherwise the diagram disappears
  // when **switching themes** or **reloading the page**.
  // The cause is that the diagram is deleted during rendering (out of Vue's knowledge).
  // Because svgCode does NOT change, v-html does not re-render.
  // This is not required for all diagrams, but it is required for c4c, mindmap and zenuml.
  const salt = Math.random().toString(36).substring(7);
  svg.value = `${svgCode} <span style="display: none">${salt}</span>`;
};
</script>

<style>
.mermaid-diagram.pending {
  min-height: 150px;
}

.editable-code:focus {
  outline: none; /* Removes the default focus indicator */
}

.buttons-container {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.buttons-container > span {
  cursor: default;
  opacity: 0.5;
  font-size: 0.8rem;
}

.buttons-container > button {
  color: #007bffbf;
  font-weight: bold;
  cursor: pointer;
}

.buttons-container > button:hover {
  color: #007bff;
}
</style>
