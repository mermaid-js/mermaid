import { readFile } from 'node:fs/promises';
import { transformAsync } from '@babel/core';
import type { Plugin } from 'esbuild';

export const coverageEnabled = process.env.MERMAID_COVERAGE === 'true';

/**
 * Instruments mermaid source with istanbul for Cypress e2e coverage. Restores
 * what `vite-plugin-istanbul` did before the build moved from vite to esbuild.
 *
 * babel-plugin-istanbul records coverage against the original TypeScript source
 * positions; instrumenting esbuild-transpiled JS instead misattributes coverage
 * to the wrong lines. babel parses TS via its parser plugin and leaves
 * type-stripping to esbuild, which loads the instrumented output below.
 */
export const coveragePlugin = (): Plugin => ({
  name: 'mermaid-istanbul-coverage',
  setup(build) {
    // Scoped to mermaid src: keeps coverage focused, and avoids per-file
    // transpilation breaking bare type re-exports in generated barrels (e.g. the
    // langium parser `index.ts`); mermaid src has none (consistent-type-imports).
    build.onLoad({ filter: /packages\/mermaid\/src\/.+\.(ts|js)$/ }, async (args) => {
      if (
        args.path.includes('/node_modules/') ||
        args.path.includes('/generated/') ||
        args.path.includes('/__mocks__/') ||
        /\.(spec|test)\.[jt]s$/.test(args.path)
      ) {
        return;
      }

      const source = await readFile(args.path, 'utf8');
      const result = await transformAsync(source, {
        filename: args.path,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript'], sourceType: 'module' },
        plugins: ['babel-plugin-istanbul'],
        sourceMaps: 'inline',
      });
      return { contents: result?.code ?? source, loader: 'ts' };
    });
  },
});
