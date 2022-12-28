import { defineConfig } from 'vite';
import { createVuePlugin as vue } from 'vite-plugin-vue2';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/core.ts',
      name: '@zenuml/core',
      fileName: 'zenuml-core',
    },
  },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    deps: {
      inline: [''],
    },
  },
});
