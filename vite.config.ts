import jison from './.vite/jisonPlugin';
import { defineConfig } from 'vitest/config';
import createVuePlugin from '@vitejs/plugin-vue';

export default defineConfig({
  resolve: {
    extensions: ['.jison', '.js', '.ts', '.json'],
  },
  plugins: [
    jison(),
    createVuePlugin({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2,
          },
        },
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // TODO: should we move this to a mermaid-core package?
    setupFiles: ['packages/mermaid/src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
  build: {
    /** If you set esmExternals to true, this plugins assumes that
     all external dependencies are ES modules */

    commonjsOptions: {
      esmExternals: true,
    },
  },
});
