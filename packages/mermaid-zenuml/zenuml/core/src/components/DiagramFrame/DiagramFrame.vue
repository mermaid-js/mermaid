<template>
  <div ref="export" class="zenuml p-1 bg-skin-canvas" style="display: inline-block" :class="theme">
    <!-- We have enabled important: ".zenuml" for tailwind.
          1. Don't use inline-block as class name here. Other clients may not have .zenuml at ancestor level.
          2. .zenuml is used to make sure tailwind css takes effect.
     -->
    <!-- pb-8 is to offset pt-8 in SeqDiagram component
        .whitespace-nowrap will be inherited by all children
     -->
    <debug />
    <div
      class="frame text-skin-frame bg-skin-frame border-skin-frame relative m-1 origin-top-left whitespace-nowrap border rounded"
      :style="{ transform: `scale(${scale})` }"
    >
      <div ref="content">
        <div
          class="header text-skin-title bg-skin-title border-skin-frame border-b p-1 flex justify-between rounded-t"
        >
          <div class="left hide-export">
            <slot></slot>
          </div>
          <div class="right flex-grow flex justify-between">
            <diagram-title :context="title" />
            <!-- Knowledge: how to vertically align a svg icon. -->
            <privacy class="hide-export flex items-center" />
          </div>
        </div>
        <div>
          <div
            v-if="showTips"
            class="fixed z-40 inset-0 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <TipsDialog />
          </div>
        </div>
        <seq-diagram ref="diagram" />
      </div>
      <div class="footer p-1 flex justify-between">
        <button class="bottom-1 left-1 hide-export" @click="showTipsDialog()">
          <svg
            class="filter grayscale"
            style="
              width: 1em;
              height: 1em;
              vertical-align: middle;
              fill: currentColor;
              overflow: hidden;
            "
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M514 912c-219.9 0-398.8-178.9-398.8-398.9 0-219.9 178.9-398.8 398.8-398.8s398.9 178.9 398.9 398.8c-0.1 220-179 398.9-398.9 398.9z m0-701.5c-166.9 0-302.7 135.8-302.7 302.7S347.1 815.9 514 815.9s302.7-135.8 302.7-302.7S680.9 210.5 514 210.5z"
              fill="#BDD2EF"
            />
            <path
              d="M431.1 502.4c-0.1 0.3 0.3 0.4 0.4 0.2 6.9-11.7 56.5-89.1 23.4 167.3-17.4 134.7 122.9 153.6 142.3-7.9 0.1-1-1.3-1.4-1.7-0.4-11.9 37.2-49.6 104.9-4.7-155.2 18.6-107.2-127.6-146-159.7-4z"
              fill="#2867CE"
            />
            <path d="M541.3 328m-68 0a68 68 0 1 0 136 0 68 68 0 1 0-136 0Z" fill="#2867CE" />
          </svg>
        </button>
        <div
          class="zoom-controls bg-skin-base text-skin-control flex justify-between w-28 hide-export"
          :style="{ transform: `scale(${1 / scale})` }"
        >
          <button class="zoom-in px-1" @click="zoomIn()">+</button>
          <label>{{ Number(scale * 100).toFixed(0) }} %</label>
          <button class="zoom-out px-1" @click="zoomOut()">-</button>
        </div>
        <width-provider />
        <a
          target="_blank"
          href="https://zenuml.com"
          class="brand text-skin-link absolute bottom-1 right-1 text-xs"
          >ZenUML.com</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import Privacy from './Privacy/Privacy.vue';
import DiagramTitle from './DiagramTitle/DiagramTitle.vue';
import SeqDiagram from './SeqDiagram/SeqDiagram.vue';
import TipsDialog from './Tutorial/TipsDialog.vue';
import WidthProvider from './Positioning/WidthProvider.vue';
import * as htmlToImage from 'html-to-image';
import Debug from './Debug/Debug.vue';

export default {
  name: 'DiagramFrame',
  computed: {
    ...mapState(['showTips', 'scale', 'theme']),
    ...mapGetters(['rootContext']),
    title() {
      if (!this.rootContext) {
        console.error('`rootContext` is empty. Please make sure `store` is properly configured.');
      }
      return this.rootContext?.title();
    },
  },
  methods: {
    ...mapMutations(['setScale']),
    showTipsDialog() {
      this.$store.state.showTips = true;

      try {
        this.$gtag?.event('view', {
          event_category: 'help',
          event_label: 'tips dialog',
        });
      } catch (e) {
        console.error(e);
      }
    },
    toPng() {
      return htmlToImage.toPng(this.$refs['export'], {
        backgroundColor: 'white',
        filter: (node) => {
          return !node?.classList?.contains('hide-export');
        },
      });
    },
    toSvg() {
      return htmlToImage.toSvg(this.$refs['export'], {
        backgroundColor: 'white',
        filter: (node) => {
          return !node?.classList?.contains('hide-export');
        },
      });
    },
    toBlob() {
      return htmlToImage.toBlob(this.$refs['export'], {
        backgroundColor: 'white',
        filter: (node) => {
          return !node?.classList?.contains('hide-export');
        },
      });
    },
    toJpeg() {
      // It does not render the 'User' svg icon.
      return htmlToImage.toJpeg(this.$refs['export'], {
        backgroundColor: 'white',
        filter: (node) => {
          return !node?.classList?.contains('hide-export');
        },
      });
    },
    zoomIn() {
      this.setScale(this.scale + 0.1);
    },
    zoomOut() {
      this.setScale(this.scale - 0.1);
    },
    setTheme(theme) {
      this.theme = theme;
    },
    setStyle(style) {
      const styleElementId = 'zenuml-style';
      // check if style element exists
      let styleElement = document.getElementById(styleElementId);
      if (!styleElement) {
        // create a style element and inject the content as textContent
        styleElement = document.createElement('style');
        // give the element a unique id
        styleElement.id = styleElementId;
        document.head.append(styleElement);
      }
      styleElement.textContent = style;
    },
    setRemoteCss(url) {
      const hostname = new URL(url).hostname;

      // if url is from github, we fetch the raw content and set the style
      // if url contains github.com or githubusercontent.com, we fetch the raw content and set the style
      if (hostname === 'https://github.com' || hostname === 'https://githubusercontent.com') {
        fetch(url.replace('github.com', 'raw.githubusercontent.com').replace('blob/', ''))
          .then((response) => response.text())
          .then((text) => {
            this.setStyle(text);
          });
        return;
      }
      const remoteCssUrlId = 'zenuml-remote-css';
      // check if remote css element exists
      let remoteCssElement = document.getElementById(remoteCssUrlId);
      if (!remoteCssElement) {
        // create a style element and inject the content as textContent
        remoteCssElement = document.createElement('link');
        // give the element a unique id
        remoteCssElement.id = remoteCssUrlId;
        remoteCssElement.rel = 'stylesheet';
        document.head.append(remoteCssElement);
      }
      remoteCssElement.href = url;
    },
  },
  components: {
    Debug,
    WidthProvider,
    TipsDialog,
    DiagramTitle,
    SeqDiagram,
    Privacy,
  },
};
</script>
