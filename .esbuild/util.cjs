const { transformJison } = require('./jisonTransformer.cjs');
const fs = require('fs');
const { dependencies } = require('../package.json');

/** @typedef {import('esbuild').BuildOptions} Options */

const packageOptionsMap = {
  mermaid: {
    globalName: 'mermaid',
    entryPoints: ['packages/mermaid/src/mermaid.ts'],
  },
};

/**
 * @param {string} pkg - Package name.
 * @param {Options} override
 * @returns {Options}
 */
const buildOptions = (pkg, override = {}) => {
  const packageOptions = packageOptionsMap[pkg];
  if (!packageOptions) {
    throw new Error(`Unknown package: ${pkg}`);
  }
  return {
    bundle: true,
    minify: true,
    keepNames: true,
    banner: { js: '"use strict";' },
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    resolveExtensions: ['.ts', '.js', '.mjs', '.json', '.jison'],
    external: ['require', 'fs', 'path'],
    plugins: [jisonPlugin],
    sourcemap: 'external',
    outdir: 'dist',
    ...packageOptions,
    ...override,
  };
};

/**
 * Build options for mermaid.esm.* build.
 *
 * For ESM browser use.
 *
 * @param {string} pkg - Package name.
 * @param {Options} override - Override options.
 * @returns {Options} ESBuild build options.
 */
exports.esmBuild = (pkg, override = { minify: true }) => {
  return buildOptions(pkg, {
    format: 'esm',
    outExtension: { '.js': `.esm${override.minify ? '.min' : ''}.mjs` },
    ...override,
  });
};

/**
 * Build options for mermaid.core.* build.
 *
 * This build does not bundle `./node_modules/`, as it is designed to be used with
 * Webpack/ESBuild/Vite to use mermaid inside an app/website.
 *
 * @param {string} pkg - Package name.
 * @param {Options} override - Override options.
 * @returns {Options} ESBuild build options.
 */
exports.esmCoreBuild = (pkg, override) => {
  return buildOptions(pkg, {
    format: 'esm',
    outExtension: { '.js': '.core.mjs' },
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
 * @param {string} pkg - Package name.
 * @param {Options} override - Override options.
 * @returns {Options} ESBuild build options.
 */
exports.iifeBuild = (pkg, override = { minify: true }) => {
  return buildOptions(pkg, {
    outExtension: { '.js': `${override.minify ? '.min' : ''}.js` },
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
