import jison from 'jison';
import { defineConfig } from 'vitest/config';

const fileRegex = /\.(jison)$/;

/** Transforms jison to js. */
export function jisonPlugin() {
  return {
    name: 'transform-jison',

    transform(src: string, id: string) {
      if (fileRegex.test(id)) {
        return {
          // @ts-ignore
          code: new jison.Generator(src, { 'token-stack': true }).generate(),
          map: null, // provide source map if available
        };
      }
    },
  };
}

export default defineConfig({
  resolve: {
    extensions: ['.jison', '.js', '.ts', '.json'],
  },
  plugins: [jisonPlugin()],
  test: {
    // coverage: {
    //   enabled: true,
    // },
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    clearMocks: true,
    deps: {
      inline: ['dagre-d3', 'd3'],
    },
    setupFiles: ['src/tests/setup.ts'],
  },
});
