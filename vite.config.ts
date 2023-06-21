import jison from './.vite/jisonPlugin.js';
import typescript from '@rollup/plugin-typescript';
import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.js'],
  },
  plugins: [
    jison(),
    // @ts-expect-error According to the type definitions, rollup plugins are incompatible with vite
    typescript({ compilerOptions: { declaration: false } }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // TODO: should we move this to a mermaid-core package?
    setupFiles: ['packages/mermaid/src/tests/setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      exclude: [...defaultExclude, '**/tests/**', '**/__mocks__/**', '**/generated/'],
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
