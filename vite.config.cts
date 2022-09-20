import jison from './.esbuild/jison';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mermaid.ts'),
      name: 'mermaid',
      // the proper extensions will be added
      fileName: 'mermaid',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['require', 'fs', 'path'],
      output: [
        {
          name: 'mermaid',
          format: 'esm',
          sourcemap: true,
        },
        {
          name: 'mermaid',
          format: 'umd',
          sourcemap: true,
        },
      ],
    },
  },
  resolve: {
    extensions: ['.jison', '.js', '.ts', '.json'],
  },
  plugins: [jison()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/tests/setup.ts'],
  },
});
