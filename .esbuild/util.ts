import { resolve } from 'path';
import { fileURLToPath } from 'url';
import type { BuildOptions } from 'esbuild';
import { readFileSync } from 'fs';
import jsonSchemaPlugin from './jsonSchemaPlugin.js';
import type { PackageOptions } from '../.build/common.js';
import { jisonPlugin } from './jisonPlugin.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export interface MermaidBuildOptions extends BuildOptions {
  minify: boolean;
  core: boolean;
  metafile: boolean;
  format: 'esm' | 'iife';
  options: PackageOptions;
  includeLargeFeatures: boolean;
}

export const defaultOptions: Omit<MermaidBuildOptions, 'entryName' | 'options'> = {
  minify: false,
  metafile: false,
  core: false,
  format: 'esm',
  includeLargeFeatures: true,
} as const;

const buildOptions = (override: BuildOptions): BuildOptions => {
  return {
    bundle: true,
    minify: true,
    keepNames: true,
    platform: 'browser',
    tsconfig: 'tsconfig.json',
    resolveExtensions: ['.ts', '.js', '.json', '.jison', '.yaml'],
    external: ['require', 'fs', 'path'],
    outdir: 'dist',
    plugins: [jisonPlugin, jsonSchemaPlugin],
    sourcemap: 'external',
    ...override,
  };
};

const getFileName = (
  fileName: string,
  { core, format, minify, includeLargeFeatures }: MermaidBuildOptions
) => {
  if (core) {
    fileName += '.core';
  } else if (format === 'esm') {
    fileName += '.esm';
  }
  if (!includeLargeFeatures) {
    fileName += '.tiny';
  }
  if (minify) {
    fileName += '.min';
  }
  return fileName;
};

export const getBuildConfig = (options: MermaidBuildOptions): BuildOptions => {
  const {
    core,
    format,
    options: { name, file, packageName },
    globalName = 'mermaid',
    includeLargeFeatures,
    ...rest
  } = options;

  const external: string[] = ['require', 'fs', 'path'];
  const outFileName = getFileName(name, options);
  const { dependencies, version } = JSON.parse(
    readFileSync(resolve(__dirname, `../packages/${packageName}/package.json`), 'utf-8')
  );
  const output: BuildOptions = buildOptions({
    ...rest,
    absWorkingDir: resolve(__dirname, `../packages/${packageName}`),
    entryPoints: {
      [outFileName]: `src/${file}`,
    },
    globalName,
    logLevel: 'info',
    chunkNames: `chunks/${outFileName}/[name]-[hash]`,
    define: {
      // This needs to be stringified for esbuild
      'injected.includeLargeFeatures': `${includeLargeFeatures}`,
      'injected.version': `'${version}'`,
      'import.meta.vitest': 'undefined',
    },
  });

  if (core) {
    // Core build is used to generate file without bundled dependencies.
    // This is used by downstream projects to bundle dependencies themselves.
    // Ignore dependencies and any dependencies of dependencies
    external.push(...Object.keys(dependencies));
    output.external = external;
  }

  if (format === 'iife') {
    output.format = 'iife';
    output.splitting = false;
    const originalGlobalName = output.globalName ?? 'mermaid';
    output.globalName = `__esbuild_esm_mermaid_nm[${JSON.stringify(originalGlobalName)}]`;
    // Workaround for removing the .default access in esbuild IIFE.
    // https://github.com/mermaid-js/mermaid/pull/4109#discussion_r1292317396
    output.footer = {
      js: `globalThis[${JSON.stringify(originalGlobalName)}] = globalThis.${output.globalName}.default;`,
    };
    output.outExtension = { '.js': '.js' };
  } else {
    output.format = 'esm';
    output.splitting = true;
    output.outExtension = { '.js': '.mjs' };
  }

  return output;
};
