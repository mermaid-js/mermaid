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
    setupFiles: ['src/tests/setup.ts'],
  },
});
