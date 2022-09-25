import jison from './.vite/jisonPlugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.jison', '.js', '.ts', '.json'],
  },
  plugins: [jison()],
  test: {
    environment: 'jsdom',
    globals: true,
    // TODO: should we move this to a mermaid-core package?
    setupFiles: ['packages/mermaid/src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
    },
  },
});
