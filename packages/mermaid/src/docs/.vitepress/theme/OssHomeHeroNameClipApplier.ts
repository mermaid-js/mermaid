import { defineComponent, nextTick, onMounted } from 'vue';

import { applyOssHomeHeroNameClipClass } from '../ossHeroClass.js';

/**
 * Option B: a small Home-only component that applies `oss-home-name-clip`
 * to VitePress' hero name wrapper after mount.
 */
export default defineComponent({
  name: 'OssHomeHeroNameClipApplier',
  setup() {
    const run = async () => {
      // Client-only.
      if (typeof window === 'undefined') {
        return;
      }

      // Ensure DOM is flushed.
      await nextTick();

      applyOssHomeHeroNameClipClass({
        doc: document,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
      });
    };

    onMounted(() => {
      void run();
    });

    // No markup needed.
    return () => null;
  },
});
