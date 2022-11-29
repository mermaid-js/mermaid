<template>
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
});

const svg = ref(null);
let mut = null;

const mermaidConfig = {
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
  const hasDarkClass = document.documentElement.classList.contains('dark');
  mermaidConfig.theme = hasDarkClass ? 'dark' : 'default';

  console.log({ mermaidConfig });
  svg.value = await render(props.id, decodeURIComponent(props.graph), mermaidConfig);
};
</script>
