<template>
  <div v-if="props.showCode">
    <h5>Code:</h5>
    <div class="language-mermaid">
      <button class="copy"></button>
      <span class="lang">mermaid</span>
      <pre><code :contenteditable="contentEditable" @input="updateCode"  @keydown.meta.enter="renderChart" @keydown.ctrl.enter="renderChart" ref="editableContent" class="editable-code"></code></pre>
      <div class="buttons-container">
        <span>{{ ctrlSymbol }} + Enter</span><span>|</span>
        <button @click="renderChart">Run ▶</button>
      </div>
    </div>
  </div>
  <div v-html="svg"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { render } from './mermaid';

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
});

const svg = ref('');
const code = ref(decodeURIComponent(props.graph));
const ctrlSymbol = ref(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
const editableContent = ref(null);
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const contentEditable = ref(isFirefox ? 'true' : 'plaintext-only');

let mut = null;

const updateCode = (event) => {
  code.value = event.target.innerText;
};

onMounted(async () => {
  mut = new MutationObserver(() => renderChart());
  mut.observe(document.documentElement, { attributes: true });

  if (editableContent.value) {
    // Set the initial value of the contenteditable element
    // We cannot bind using `{{ code }}` because it will rerender the whole component
    // when the value changes, shifting the cursor when enter is used
    editableContent.value.textContent = code.value;
  }

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
});

onUnmounted(() => mut.disconnect());

const renderChart = async () => {
  console.log('rendering chart' + props.id + code.value);
  const hasDarkClass = document.documentElement.classList.contains('dark');
  const mermaidConfig = {
    securityLevel: 'loose',
    startOnLoad: false,
    theme: hasDarkClass ? 'dark' : 'default',
  };
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
