const { Generator } = require('jison');
const fs = require('fs');

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
    resolveExtensions: ['.ts', '.js', '.json', '.jison'],
    external: ['require', 'fs', 'path'],
    entryPoints: ['src/mermaid.ts'],
    outfile: 'dist/mermaid.min.js',
    plugins: [jisonPlugin],
    sourcemap: 'external',
    ...override,
  };
};

/**
 * @param {Options} override
 * @returns {Options}
 */
exports.esmBuild = (override = { minify: true }) => {
  return buildOptions({
    format: 'esm',
    outfile: `dist/mermaid.esm${override.minify ? '.min' : ''}.mjs`,
    ...override,
  });
};

/**
 * @param {Options & { core?: boolean }} override
 * @returns {Options}
 */
exports.iifeBuild = (override = { minify: true, core: false }) => {
  const core = override.core;
  if (core && override.minify) {
    throw new Error('Cannot minify core build');
  }
  delete override.core;
  return buildOptions({
    outfile: `dist/mermaid${override.minify ? '.min' : core ? '.core' : ''}.js`,
    format: 'iife',
    ...override,
  });
};

const jisonPlugin = {
  name: 'jison',
  setup(build) {
    build.onLoad({ filter: /\.jison$/ }, async (args) => {
      // Load the file from the file system
      const source = await fs.promises.readFile(args.path, 'utf8');
      const contents = new Generator(source, { 'token-stack': true }).generate({
        moduleMain: '() => {}', // disable moduleMain (default one requires Node.JS modules)
      });
      return { contents, warnings: [] };
    });
  },
};
