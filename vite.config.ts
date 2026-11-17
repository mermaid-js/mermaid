import jison from './.vite/jisonPlugin.js';
import jsonSchemaPlugin from './.vite/jsonSchemaPlugin.js';
import typescript from '@rollup/plugin-typescript';
import { defaultClientConditions, defaultServerConditions } from 'vite';
import { defaultExclude, defineConfig } from 'vitest/config';
import { sourceCondition } from './.build/common.js';

/**
 * Resolve workspace packages to their source, on top of the conditions Vite
 * (or Vitest, which drops `module` and `browser`) would use.
 */
const conditions = [
  sourceCondition,
  ...(process.env.VITEST
    ? defaultServerConditions.filter((condition) => condition !== 'module')
    : defaultClientConditions),
];

export default defineConfig({
  resolve: {
    extensions: ['.js'],
    conditions,
  },
  plugins: [
    jison(),
    jsonSchemaPlugin(), // handles .schema.yaml JSON Schema files
    typescript({ compilerOptions: { declaration: false } }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './packages/core/src/tests/setup.ts',
      './packages/mermaid/src/tests/registerDiagrams.ts',
    ],
    exclude: [
      ...defaultExclude,
      'e2e/rendering/**',
      'e2e/other/**',
      './tests/**',
      '**/__mocks__/**',
      '**/generated/',
    ],
    // TODO: should we move this to a mermaid-core package?
    coverage: {
      provider: 'v8',
      // Only report files that unit tests actually exercise. Diagram render/style
      // files are covered by the e2e suite, not unit tests; reporting them here at
      // 0% makes them merge with the e2e flag on Codecov and paint e2e-covered
      // files red in the combined view.
      all: false,
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      exclude: [
        ...defaultExclude,
        './tests/**',
        'e2e/rendering/**',
        'e2e/other/**',
        '**/__mocks__/**',
        '**/generated/',
      ],
    },
    includeSource: ['packages/*/src/**/*.{js,ts}'],
    clearMocks: true,
  },
  build: {
    /** If you set esmExternals to true, this plugins assumes that
     all external dependencies are ES modules */

    commonjsOptions: {
      esmExternals: true,
    },
  },
  define: {
    // Needs to be string
    'injected.profiling': 'false',
    'import.meta.vitest': 'undefined',
    packageVersion: "'0.0.0'",
  },
});
