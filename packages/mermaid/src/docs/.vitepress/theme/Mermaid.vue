<template>
  <div v-html="svg"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, toRaw } from 'vue';
import mermaid from 'mermaid';
import mindmap from '@mermaid-js/mermaid-mindmap';
import { useData } from 'vitepress';
try {
  await mermaid.registerExternalDiagrams([mindmap]);
} catch (e) {}

const props = defineProps({
  graph: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});

const svg = ref(null);
let mut = null;

const { page } = useData();
const { frontmatter } = toRaw(page.value);
const mermaidPageTheme = frontmatter.mermaidTheme || '';
let mermaidConfig = {
  securityLevel: 'loose',
  startOnLoad: false,
};

onMounted(async () => {
  mut = new MutationObserver(() => renderChart());
  mut.observe(document.documentElement, { attributes: true });
  await renderChart();

  //refresh images on first render
  const hasImages = /<img([\w\W]+?)>/.exec(decodeURIComponent(props.graph))?.length > 0;
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
  console.log('rendering chart' + props.id + props.graph);
  let hasDarkClass = document.documentElement.classList.contains('dark');
  mermaidConfig.theme = mermaidPageTheme || mermaidConfig.theme;
  if (hasDarkClass) mermaidConfig.theme = 'dark';

  mermaid.initialize({
    ...mermaidConfig,
    theme: hasDarkClass ? 'dark' : mermaidPageTheme,
  });
  svg.value = await mermaid.renderAsync(props.id, decodeURIComponent(props.graph));
};
</script>
