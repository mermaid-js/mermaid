import { readFile } from 'node:fs/promises';
import { transform, type Plugin } from 'esbuild';
import { createInstrumenter } from 'istanbul-lib-instrument';

export const coverageEnabled = process.env.MERMAID_COVERAGE === 'true';

/**
 * Instruments mermaid source with istanbul for Cypress e2e coverage. Restores
 * what `vite-plugin-istanbul` did before the build moved from vite to esbuild.
 * istanbul can't parse TypeScript, so each file is transpiled to JS first.
 */
export const coveragePlugin = (): Plugin => ({
  name: 'mermaid-istanbul-coverage',
  setup(build) {
    const instrumenter = createInstrumenter({
      esModules: true,
      compact: false,
      produceSourceMap: true,
      coverageVariable: '__coverage__',
    });

    // Scoped to mermaid src: per-file transpilation keeps bare type re-exports
    // that whole-program bundling drops, breaking generated barrels (e.g. the
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
      const { code, map } = await transform(source, {
        loader: args.path.endsWith('.ts') ? 'ts' : 'js',
        sourcemap: true,
        sourcefile: args.path,
      });

      const instrumented = instrumenter.instrumentSync(
        code,
        args.path,
        JSON.parse(map) as Record<string, unknown>
      );
      return { contents: instrumented, loader: 'js' };
    });
  },
});
