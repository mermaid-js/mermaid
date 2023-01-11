/* eslint-env es6 */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin as vue } from 'vite-plugin-vue2';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  build: {
    // https://vitejs.dev/guide/build.html#library-mode
    lib: {
      entry: resolve(__dirname, 'src/core.ts'),
      // https://vitejs.dev/config/build-options.html#build-lib
      // the exposed global variable and is required when formats includes 'umd' or 'iife'.
      name: 'ZenUML',
      fileName: 'zenuml',
    },
    rollupOptions: {
      output: [
        {
          format: 'esm',
          sourcemap: true,
          // https://rollupjs.org/guide/en/#outputentryfilenames
          // It will use the file name in `build.lib.entry` without extension as `[name]` if `[name].xxx.yyy` is provided.
          // So we hard code as zenuml. We may consider rename `core.ts` to `zenuml.ts`.
          // If this field is not provided, result with be ${build.lib.filename}.esm.js.
          // Mermaid's build.ts output hardcoded esm file as '.mjs', thus we need this config.
          entryFileNames: `zenuml.esm.mjs`,
        },
        {
          name: 'zenuml', //  it is the global variable name representing your bundle. https://rollupjs.org/guide/en/#outputname
          format: 'umd',
          sourcemap: true,
          entryFileNames: `zenuml.js`,
        },
      ],
    },
  },
  plugins: [vue(), cssInjectedByJsPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    deps: {
      inline: [''],
    },
  },
});
