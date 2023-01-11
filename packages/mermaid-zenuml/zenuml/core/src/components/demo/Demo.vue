<template>
  <div>
    <DiagramFrame ref="diagram">
      <label>Left side</label>
    </DiagramFrame>
    <button @click="exportPng">Export PNG</button>
    <button @click="exportJpeg">Export JPEG</button>
    <button @click="exportBlob">Export Blob</button>
    <button @click="exportSvg">Export Svg</button>
  </div>
</template>

<script>
import DiagramFrame from '@/components/DiagramFrame';
import { saveAs } from 'file-saver';
export default {
  name: 'Demo',
  methods: {
    async exportPng() {
      const png = await this.$refs.diagram.toPng();
      saveAs(png, 'diagram.png');
    },
    async exportJpeg() {
      const png = await this.$refs.diagram.toJpeg();
      saveAs(png, 'diagram.jpeg');
    },
    async exportBlob() {
      const blob = await this.$refs.diagram.toBlob();
      saveAs(blob, 'diagram-blob.png');
    },
    async exportSvg() {
      const svg = await this.$refs.diagram.toSvg();
      saveAs(svg, 'diagram-svg.svg');
    },
  },
  components: { DiagramFrame },
};
</script>

<style scoped></style>
