const { transformJison } = require('./jisonTransformer.cjs');
const fs = require('fs');
const { dependencies } = require('../package.json');

/** @typedef {import('esbuild').BuildOptions} Options */

/**
 * @param {Options} override
 * @returns {Options}
 */
const buildOptions = (override = {}) => {
  return {
    bundle: true,
    minify: true,
    keepNames: true,
    banner: { js: '"use strict";' },
    globalName: 'mermaid',
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    resolveExtensions: ['.ts', '.js', '.mjs', '.json', '.jison'],
    external: ['require', 'fs', 'path'],
    entryPoints: ['src/registry.ts'],
    outfile: 'dist/mermaid-mindmap.min.js',
    plugins: [jisonPlugin],
    sourcemap: 'external',
    ...override,
  };
};

/**
 * Build options for mermaid.esm.* build.
 *
 * For ESM browser use.
 *
 * @param {Options} override - Override options.
 * @returns {Options} ESBuild build options.
 */
exports.esmBuild = (override = { minify: true }) => {
  return buildOptions({
    format: 'esm',
    outfile: `dist/mermaid.esm${override.minify ? '.min' : ''}.mjs`,
    ...override,
  });
};

/**
 * Build options for mermaid.core.* build.
 *
 * This build does not bundle `./node_modules/`, as it is designed to be used with
 * Webpack/ESBuild/Vite to use mermaid inside an app/website.
 *
 * @param {Options} override - Override options.
 * @returns {Options} ESBuild build options.
 */
exports.esmCoreBuild = (override) => {
  return buildOptions({
    format: 'esm',
    outfile: `dist/mermaid.core.mjs`,
    external: ['require', 'fs', 'path', ...Object.keys(dependencies)],
    platform: 'neutral',
    ...override,
  });
};

/**
 * Build options for mermaid.js build.
 *
 * For IIFE browser use (where ESM is not yet supported).
 *
 * @param {Options} override - Override options.
 * @returns {Options} ESBuild build options.
 */
exports.iifeBuild = (override = { minify: true }) => {
  return buildOptions({
    outfile: `dist/mermaid${override.minify ? '.min' : ''}.js`,
    format: 'iife',
    footer: {
      js: 'mermaid = mermaid.default;',
    },
    ...override,
  });
};

const jisonPlugin = {
  name: 'jison',
  setup(build) {
    build.onLoad({ filter: /\.jison$/ }, async (args) => {
      // Load the file from the file system
      const source = await fs.promises.readFile(args.path, 'utf8');
      const contents = transformJison(source);
      return { contents, warnings: [] };
    });
  },
};
